import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

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