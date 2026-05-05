import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PERMISSIONS,
  Role,
  PermissionAction,
  hasPermission,
  getAllowedInterviewResults as getConstrainedInterviewResults,
  canSetInterviewResult,
  getAllowedTransitions,
  STATUS_GROUPS,
} from '../recruitment/constraints';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, userRole: string, action: PermissionAction): Promise<boolean> {
    // 1. Try to check from DB Role permissions
    const user = await this.prisma.user?.findUnique?.({
      where: { id: userId },
      include: { roleObj: true }
    });

    if (user?.roleObj?.permissions) {
      const permissions = user.roleObj.permissions as string[];
      if (permissions.includes(action)) return true;
    }

    // 2. Fallback to hardcoded constraints using userRole string
    return hasPermission(userRole as Role, action);
  }

  /**
   * Assert permission or throw ForbiddenException
   */
  async assertPermission(userId: string, userRole: string, action: PermissionAction): Promise<void> {
    const permitted = await this.hasPermission(userId, userRole, action);
    if (!permitted) {
      throw new ForbiddenException(`Bạn không có quyền thực hiện hành động: ${action}`);
    }
  }

  async getUserWithRelations(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        managedStore: { select: { id: true, amId: true } },
        amStores: { select: { id: true } }
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
        amStores: { select: { id: true } }
      }
    });

    if (!user) throw new ForbiddenException('User not found');

    if (userRole === 'ADMIN') {
      const allStores = await this.prisma.store.findMany({ select: { id: true } });
      return allStores.map(s => s.id);
    }

    if (userRole === 'SM' && user.managedStore) {
      return [user.managedStore.id];
    }

    if (userRole === 'AM') {
      if (user.amStores?.length > 0) {
        return user.amStores.map(s => s.id);
      }
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
  async getVisibleProposalIds(userId: string, userRole: string): Promise<string[]> {
    const myStoreIds = await this.getAccessibleStoreIds(userId, userRole);
    
    if (userRole === 'ADMIN') {
      const allProposals = await this.prisma.recruitmentProposal.findMany({ select: { id: true } });
      return allProposals.map(p => p.id);
    }

    if (userRole === 'AM' && myStoreIds.length > 0) {
      const proposals = await this.prisma.recruitmentProposal.findMany({
        where: { storeId: { in: myStoreIds } },
        select: { id: true }
      });
      return proposals.map(p => p.id);
    }

    if (userRole === 'SM' && myStoreIds.length > 0) {
      const myStore = await this.prisma.store.findFirst({
        where: { id: { in: myStoreIds } },
        select: { amId: true }
      });

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
  async getProposalViewableUserIds(userId: string, userRole: string): Promise<string[]> {
    if (userRole === 'ADMIN') {
      const allUsers = await this.prisma.user.findMany({ select: { id: true } });
      return allUsers.map(u => u.id);
    }

    if (userRole === 'AM') {
      const myStoreIds = await this.getAccessibleStoreIds(userId, userRole);
      const smIds = await this.prisma.store.findMany({
        where: { id: { in: myStoreIds }, smId: { not: null } },
        select: { smId: true }
      });
      return smIds.map(s => s.smId!).filter(Boolean);
    }

    if (userRole === 'SM') {
      const myUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { managedStore: true }
      });
      
      if (!myUser?.managedStore?.amId) return [userId];
      
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

  // Allowed interview results for SM/AM role - DEPRECATED, use constraints.ts
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
    if (userRole === 'ADMIN') return true;
    if (userRole === 'RECRUITER') return false;
    return canSetInterviewResult(userRole as Role, result);
  }

  // Get allowed interview results for frontend
  getAllowedInterviewResults(userRole: string): { code: string; name: string }[] {
    if (userRole === 'ADMIN') {
      return [
        { code: 'SM_AM_PASSED', name: 'SM/AM PV Đạt' },
        { code: 'SM_AM_FAILED', name: 'SM/AM PV Loại' },
        { code: 'SM_AM_NO_SHOW', name: 'Không đến phỏng vấn' },
        { code: 'OM_PV_PASSED', name: 'OM PV Đạt' },
        { code: 'OM_PV_FAILED', name: 'OM PV Loại' },
        { code: 'OM_PV_NO_SHOW', name: 'Không đến phỏng vấn' },
      ];
    }
    return getConstrainedInterviewResults(userRole as Role);
  }

  /**
   * Get allowed status transitions for a user
   * Uses centralized constraints from constraints.ts
   */
  getAllowedStatusTransitions(userRole: string, currentStatus: string | null): string[] {
    return getAllowedTransitions(currentStatus, userRole as Role);
  }

  /**
   * Check if user can perform proposal action
   */
  canPerformProposalAction(userRole: string, action: 'create' | 'submit' | 'review' | 'approve' | 'reject' | 'cancel', proposalStatus?: string): boolean {
    const matrix: Record<string, Record<string, string[]>> = {
      ADMIN: {
        create: ['*'], submit: ['*'], review: ['*'], approve: ['*'], reject: ['*'], cancel: ['*'],
      },
      AM: {
        create: ['*'], submit: ['DRAFT'], review: ['SUBMITTED'], approve: ['SUBMITTED', 'AM_REVIEWED'], reject: ['SUBMITTED', 'AM_REVIEWED'], cancel: ['DRAFT', 'SUBMITTED'],
      },
      RECRUITER: {
        create: ['*'], submit: ['*'], review: ['*'], approve: ['*'], reject: ['*'], cancel: ['*'],
      },
      SM: {
        create: ['*'], submit: ['DRAFT'], cancel: ['DRAFT', 'SUBMITTED'],
      },
    };

    const roleMatrix = matrix[userRole];
    if (!roleMatrix) return false;

    const allowedStatuses = roleMatrix[action];
    if (!allowedStatuses) return false;

    if (allowedStatuses.includes('*')) return true;
    if (!proposalStatus) return true;

    return allowedStatuses.includes(proposalStatus);
  }

  /**
   * Check if user can manage offer
   */
  canManageOffer(userRole: string, action: 'create' | 'read' | 'send' | 'update' | 'delete'): boolean {
    const matrix: Record<string, string[]> = {
      ADMIN: ['create', 'send', 'update', 'delete'],
      RECRUITER: ['create', 'send', 'update'],
      AM: ['read'],
      SM: ['read'],
    };

    const allowed = matrix[userRole] || [];
    return allowed.includes(action);
  }
}

