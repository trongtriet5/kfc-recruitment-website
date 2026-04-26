import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PermissionAction =
  | 'CANDIDATE_CREATE'
  | 'CANDIDATE_READ'
  | 'CANDIDATE_UPDATE'
  | 'CANDIDATE_DELETE'
  | 'CANDIDATE_STATUS_CHANGE'
  | 'CANDIDATE_ASSIGN_PIC'
  | 'CANDIDATE_TRANSFER_CAMPAIGN'
  | 'CANDIDATE_BLACKLIST'
  | 'PROPOSAL_CREATE'
  | 'PROPOSAL_READ'
  | 'PROPOSAL_UPDATE'
  | 'PROPOSAL_DELETE'
  | 'PROPOSAL_SUBMIT'
  | 'PROPOSAL_REVIEW'
  | 'PROPOSAL_APPROVE'
  | 'PROPOSAL_REJECT'
  | 'PROPOSAL_CANCEL'
  | 'CAMPAIGN_CREATE'
  | 'CAMPAIGN_READ'
  | 'CAMPAIGN_UPDATE'
  | 'CAMPAIGN_DELETE'
  | 'CAMPAIGN_MANAGE'
  | 'INTERVIEW_CREATE'
  | 'INTERVIEW_READ'
  | 'INTERVIEW_UPDATE'
  | 'INTERVIEW_DELETE'
  | 'OFFER_CREATE'
  | 'OFFER_READ'
  | 'OFFER_UPDATE'
  | 'OFFER_DELETE'
  | 'OFFER_SEND'
  | 'REPORT_VIEW'
  | 'REPORT_EXPORT'
  | 'SETTINGS_MANAGE'
  | 'USER_MANAGE';

export const PERMISSION_MATRIX: Record<string, PermissionAction[]> = {
  ADMIN: [
    'CANDIDATE_CREATE', 'CANDIDATE_READ', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE',
    'CANDIDATE_STATUS_CHANGE', 'CANDIDATE_ASSIGN_PIC', 'CANDIDATE_TRANSFER_CAMPAIGN', 'CANDIDATE_BLACKLIST',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE', 'PROPOSAL_DELETE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_REVIEW', 'PROPOSAL_APPROVE', 'PROPOSAL_REJECT', 'PROPOSAL_CANCEL',
    'CAMPAIGN_CREATE', 'CAMPAIGN_READ', 'CAMPAIGN_UPDATE', 'CAMPAIGN_DELETE', 'CAMPAIGN_MANAGE',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE', 'INTERVIEW_DELETE',
    'OFFER_CREATE', 'OFFER_READ', 'OFFER_UPDATE', 'OFFER_DELETE', 'OFFER_SEND',
    'REPORT_VIEW', 'REPORT_EXPORT',
    'SETTINGS_MANAGE', 'USER_MANAGE',
  ],
  HEAD_OF_DEPARTMENT: [
    'CANDIDATE_CREATE', 'CANDIDATE_READ', 'CANDIDATE_UPDATE',
    'CANDIDATE_STATUS_CHANGE', 'CANDIDATE_ASSIGN_PIC', 'CANDIDATE_TRANSFER_CAMPAIGN',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_REVIEW', 'PROPOSAL_APPROVE', 'PROPOSAL_REJECT',
    'CAMPAIGN_CREATE', 'CAMPAIGN_READ', 'CAMPAIGN_UPDATE', 'CAMPAIGN_MANAGE',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE',
    'OFFER_CREATE', 'OFFER_READ', 'OFFER_UPDATE', 'OFFER_SEND',
    'REPORT_VIEW', 'REPORT_EXPORT',
  ],
  RECRUITER: [
    'CANDIDATE_CREATE', 'CANDIDATE_READ', 'CANDIDATE_UPDATE',
    'CANDIDATE_STATUS_CHANGE', 'CANDIDATE_ASSIGN_PIC', 'CANDIDATE_TRANSFER_CAMPAIGN',
    'PROPOSAL_READ',
    'CAMPAIGN_READ', 'CAMPAIGN_UPDATE',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE',
    'OFFER_CREATE', 'OFFER_READ', 'OFFER_UPDATE', 'OFFER_SEND',
    'REPORT_VIEW',
  ],
  MANAGER: [ // Area Manager
    'CANDIDATE_READ', 'CANDIDATE_UPDATE',
    'CANDIDATE_STATUS_CHANGE',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_REVIEW', 'PROPOSAL_APPROVE', 'PROPOSAL_REJECT', 'PROPOSAL_CANCEL',
    'CAMPAIGN_READ',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE',
    'OFFER_READ',
    'REPORT_VIEW',
  ],
  USER: [ // Store Manager
    'CANDIDATE_READ',
    'CANDIDATE_STATUS_CHANGE',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_CANCEL',
    'CAMPAIGN_READ',
    'INTERVIEW_READ',
    'OFFER_READ',
    'REPORT_VIEW',
  ],
};

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user has a specific permission
   */
  hasPermission(userRole: string, action: PermissionAction): boolean {
    const permissions = PERMISSION_MATRIX[userRole] || [];
    return permissions.includes(action);
  }

  /**
   * Assert permission or throw ForbiddenException
   */
  assertPermission(userRole: string, action: PermissionAction): void {
    if (!this.hasPermission(userRole, action)) {
      throw new ForbiddenException(`Bạn không có quyền thực hiện hành động: ${action}`);
    }
  }

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
  async getVisibleProposalIds(userId: string, userRole: string): Promise<string[]> {
    const myStoreIds = await this.getAccessibleStoreIds(userId, userRole);
    
    if (userRole === 'ADMIN') {
      const allProposals = await this.prisma.recruitmentProposal.findMany({ select: { id: true } });
      return allProposals.map(p => p.id);
    }

    if (userRole === 'MANAGER' && myStoreIds.length > 0) {
      const proposals = await this.prisma.recruitmentProposal.findMany({
        where: { storeId: { in: myStoreIds } },
        select: { id: true }
      });
      return proposals.map(p => p.id);
    }

    if (userRole === 'USER' && myStoreIds.length > 0) {
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

    if (userRole === 'MANAGER') {
      const myStoreIds = await this.getAccessibleStoreIds(userId, userRole);
      const smIds = await this.prisma.store.findMany({
        where: { id: { in: myStoreIds }, smId: { not: null } },
        select: { smId: true }
      });
      return smIds.map(s => s.smId!).filter(Boolean);
    }

    if (userRole === 'USER') {
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
    if (userRole === 'ADMIN') return true;
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

  /**
   * Get allowed status transitions for a user
   */
  getAllowedStatusTransitions(userRole: string, currentStatus: string | null): string[] {
    // This is a simplified version - the full logic is in StatusTransitionService
    const allTransitions: Record<string, string[]> = {
      ADMIN: ['CV_FILTERING', 'CV_PASSED', 'CV_FAILED', 'BLACKLIST', 'CANNOT_CONTACT', 'AREA_NOT_RECRUITING', 'WAITING_INTERVIEW', 'HR_INTERVIEW_PASSED', 'HR_INTERVIEW_FAILED', 'SM_AM_INTERVIEW_PASSED', 'SM_AM_INTERVIEW_FAILED', 'SM_AM_NO_SHOW', 'OM_PV_INTERVIEW_PASSED', 'OM_PV_INTERVIEW_FAILED', 'OM_PV_NO_SHOW', 'OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'WAITING_ONBOARDING', 'ONBOARDING_ACCEPTED', 'ONBOARDING_REJECTED'],
      HEAD_OF_DEPARTMENT: ['CV_FILTERING', 'CV_PASSED', 'CV_FAILED', 'BLACKLIST', 'CANNOT_CONTACT', 'AREA_NOT_RECRUITING', 'WAITING_INTERVIEW', 'HR_INTERVIEW_PASSED', 'HR_INTERVIEW_FAILED', 'SM_AM_INTERVIEW_PASSED', 'SM_AM_INTERVIEW_FAILED', 'SM_AM_NO_SHOW', 'OM_PV_INTERVIEW_PASSED', 'OM_PV_INTERVIEW_FAILED', 'OM_PV_NO_SHOW', 'OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'WAITING_ONBOARDING', 'ONBOARDING_ACCEPTED', 'ONBOARDING_REJECTED'],
      RECRUITER: ['CV_FILTERING', 'CV_PASSED', 'CV_FAILED', 'CANNOT_CONTACT', 'AREA_NOT_RECRUITING', 'WAITING_INTERVIEW', 'HR_INTERVIEW_PASSED', 'HR_INTERVIEW_FAILED', 'OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'WAITING_ONBOARDING', 'ONBOARDING_ACCEPTED', 'ONBOARDING_REJECTED'],
      MANAGER: ['SM_AM_INTERVIEW_PASSED', 'SM_AM_INTERVIEW_FAILED', 'SM_AM_NO_SHOW', 'OM_PV_INTERVIEW_PASSED', 'OM_PV_INTERVIEW_FAILED', 'OM_PV_NO_SHOW'],
      USER: ['SM_AM_INTERVIEW_PASSED', 'SM_AM_INTERVIEW_FAILED', 'SM_AM_NO_SHOW'],
    };

    return allTransitions[userRole] || [];
  }

  /**
   * Check if user can perform proposal action
   */
  canPerformProposalAction(userRole: string, action: 'create' | 'submit' | 'review' | 'approve' | 'reject' | 'cancel', proposalStatus?: string): boolean {
    const matrix: Record<string, Record<string, string[]>> = {
      ADMIN: {
        create: ['*'], submit: ['*'], review: ['*'], approve: ['*'], reject: ['*'], cancel: ['*'],
      },
      HEAD_OF_DEPARTMENT: {
        create: ['*'], submit: ['*'], review: ['*'], approve: ['*'], reject: ['*'], cancel: ['DRAFT', 'SUBMITTED'],
      },
      MANAGER: {
        create: ['*'], submit: ['DRAFT'], review: ['SUBMITTED'], approve: ['SUBMITTED', 'AM_REVIEWED'], reject: ['SUBMITTED', 'AM_REVIEWED'], cancel: ['DRAFT', 'SUBMITTED'],
      },
      USER: {
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
  canManageOffer(userRole: string, action: 'create' | 'send' | 'update' | 'delete'): boolean {
    const matrix: Record<string, string[]> = {
      ADMIN: ['create', 'send', 'update', 'delete'],
      HEAD_OF_DEPARTMENT: ['create', 'send', 'update'],
      RECRUITER: ['create', 'send', 'update'],
      MANAGER: ['read'],
      USER: ['read'],
    };

    const allowed = matrix[userRole] || [];
    return allowed.includes(action) || allowed.includes('read');
  }
}

