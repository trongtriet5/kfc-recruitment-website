import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async getUserWithRelations(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        managedStore: { select: { id: true, amId: true } },
        managedStores: { select: { id: true } }
      }
    });
  }

  // Get AM who manages a specific store
  async getAMForStore(storeId: string): Promise<string | null> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { amId: true }
    });
    return store?.amId || null;
  }

  // Get all SMs under an AM
  async getSMsUnderAM(amId: string): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      where: { amId },
      select: { smId: true }
    });
    return stores.map(s => s.smId).filter(Boolean) as string[];
  }

  // Get store IDs that user can access
  async getAccessibleStoreIds(userId: string, userRole: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        managedStore: { select: { id: true } },
        managedStores: { select: { id: true } }
      }
    });

    if (!user) throw new ForbiddenException('User not found');

    if (userRole === 'ADMIN') {
      const allStores = await this.prisma.store.findMany({ select: { id: true } });
      return allStores.map(s => s.id);
    }

    if (userRole === 'USER' && user.managedStore) {
      return [user.managedStore.id];
    }

    if (userRole === 'MANAGER' && user.managedStores?.length > 0) {
      return user.managedStores.map(s => s.id);
    }

    return [];
  }

  // Filter candidates by user's store access
  async filterCandidatesByAccess(candidates: any[], userId: string, userRole: string): Promise<any[]> {
    const accessibleStoreIds = await this.getAccessibleStoreIds(userId, userRole);
    
    if (accessibleStoreIds.length === 0) {
      return [];
    }

    return candidates.filter(c => 
      c.storeId && accessibleStoreIds.includes(c.storeId)
    );
  }

  // Check if user can access specific candidate
  async canAccessCandidate(userId: string, userRole: string, candidate: any): Promise<boolean> {
    const accessibleStoreIds = await this.getAccessibleStoreIds(userId, userRole);
    return candidate.storeId && accessibleStoreIds.includes(candidate.storeId);
  }

  // Filter proposals by user's store access
  async filterProposalsByAccess(proposals: any[], userId: string, userRole: string): Promise<any[]> {
    const accessibleStoreIds = await this.getAccessibleStoreIds(userId, userRole);
    
    if (accessibleStoreIds.length === 0) {
      return [];
    }

    return proposals.filter(p => 
      p.storeId && accessibleStoreIds.includes(p.storeId)
    );
  }

  // Get proposal IDs visible to a user (including hierarchical view)
  // AM can see all proposals from their stores
  // SM can see proposals created by themselves AND all proposals from their AM's zone
  async getVisibleProposalIds(userId: string, userRole: string): Promise<string[]> {
    const myStoreIds = await this.getAccessibleStoreIds(userId, userRole);
    
    if (userRole === 'ADMIN') {
      const allProposals = await this.prisma.recruitmentProposal.findMany({ select: { id: true } });
      return allProposals.map(p => p.id);
    }

    // AM (MANAGER role): can see ALL proposals from their managed stores
    if (userRole === 'MANAGER' && myStoreIds.length > 0) {
      const proposals = await this.prisma.recruitmentProposal.findMany({
        where: { storeId: { in: myStoreIds } },
        select: { id: true }
      });
      return proposals.map(p => p.id);
    }

    // SM (USER role): can see:
    // 1. Their own store's proposals
    // 2. All proposals from their AM's zone (their AM's managed stores)
    if (userRole === 'USER' && myStoreIds.length > 0) {
      const myStore = await this.prisma.store.findFirst({
        where: { id: { in: myStoreIds } },
        select: { amId: true }
      });

      // Get proposals from my store AND from AM's zone
      const amStoreIds = myStore?.amId 
        ? (await this.prisma.store.findMany({
            where: { amId: myStore.amId },
            select: { id: true }
          })).map(s => s.id)
        : [];

      const allVisibleStoreIds = [...new Set([...myStoreIds, ...amStoreIds])];
      
      const proposals = await this.prisma.recruitmentProposal.findMany({
        where: { storeId: { in: allVisibleStoreIds } },
        select: { id: true }
      });
      return proposals.map(p => p.id);
    }

    return [];
  }

  // Check if a proposal is visible to user
  async canViewProposal(userId: string, userRole: string, proposalStoreId: string): Promise<boolean> {
    const visibleIds = await this.getVisibleProposalIds(userId, userRole);
    return visibleIds.includes(proposalStoreId);
  }

  // Get user IDs whose proposals the current user can view
  // For example: AM can see proposals from all SMs in their zone
  async getProposalViewableUserIds(userId: string, userRole: string): Promise<string[]> {
    if (userRole === 'ADMIN') {
      const allUsers = await this.prisma.user.findMany({ select: { id: true } });
      return allUsers.map(u => u.id);
    }

    if (userRole === 'MANAGER') {
      // AM can see proposals from all SMs in their zone
      const myStoreIds = await this.getAccessibleStoreIds(userId, userRole);
      const smIds = await this.prisma.store.findMany({
        where: { id: { in: myStoreIds }, smId: { not: null } },
        select: { smId: true }
      });
      return smIds.map(s => s.smId!).filter(Boolean);
    }

// SM can only see from their zone (AM + other SMs)
    if (userRole === 'USER') {
      const myUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { managedStore: true }
      });
      
      if (!myUser?.managedStore?.amId) return [userId];
      
      // Get all stores under the same AM, then get SMs for those stores
      const storesUnderAM = await this.prisma.store.findMany({
        where: { amId: myUser.managedStore.amId },
        select: { smId: true }
      });
      
      const smUserIds = storesUnderAM
        .map(s => s.smId)
        .filter(Boolean) as string[];
      
      if (smUserIds.length > 0) {
        return smUserIds;
      }
      return [userId];
    }

    return [userId];
  }

  // Allowed interview results for SM/AM role
  ALLOWED_INTERVIEW_RESULTS = {
    SM_AM_PASSED: 'SM/AM PV đạt',
    SM_AM_FAILED: 'SM/AM PV loại',
    SM_AM_NO_SHOW: 'SM/AM PV không đến',
    OM_PV_PASSED: 'OM PV đạt',
    OM_PV_FAILED: 'OM PV loại',
    OM_PV_NO_SHOW: 'OM PV không đến',
  };

  // Check if interview result is allowed for user role
  isAllowedInterviewResult(result: string, userRole: string): boolean {
    // ADMIN can do anything
    if (userRole === 'ADMIN') return true;

    // Only SM/AM (USER, MANAGER) can use limited results
    return Object.keys(this.ALLOWED_INTERVIEW_RESULTS).includes(result);
  }

  // Get allowed interview results for frontend
  getAllowedInterviewResults(userRole: string): { code: string; name: string }[] {
    if (userRole === 'ADMIN') {
      return [
        { code: 'PASSED', name: 'Đạt' },
        { code: 'FAILED', name: 'Không đạt' },
        { code: 'PENDING', name: 'Chờ kết quả' },
      ];
    }

    return Object.entries(this.ALLOWED_INTERVIEW_RESULTS).map(([code, name]) => ({
      code,
      name,
    }));
  }
}