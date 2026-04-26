import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

export const PROPOSAL_STATUS_FLOW = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['AM_REVIEWED', 'REJECTED', 'CANCELLED'],
  AM_REVIEWED: ['HR_ACCEPTED', 'REJECTED', 'CANCELLED'],
  HR_ACCEPTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['CANCELLED'],
  REJECTED: ['DRAFT'], // Allow resubmission as new version
  CANCELLED: [],
};

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã gửi',
  AM_REVIEWED: 'AM đã xem xét',
  HR_ACCEPTED: 'HR đã tiếp nhận',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

@Injectable()
export class ProposalService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Create a new recruitment proposal (draft)
   */
  async createProposal(data: any, userId: string, userRole: string) {
    // Auto-assign store for SM/AM
    let storeId = data.storeId;
    if (userRole !== 'ADMIN' && !storeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { managedStore: true, managedStores: true },
      });
      if (userRole === 'USER' && user?.managedStore) {
        storeId = user.managedStore.id;
      } else if (userRole === 'MANAGER' && user?.managedStores?.length === 1) {
        storeId = user.managedStores[0].id;
      }
    }

    if (!storeId) {
      throw new BadRequestException('Vui lòng chọn cửa hàng');
    }

    // Validate headcount availability
    if (data.positionId && storeId) {
      const headcount = await this.prisma.headcount.findFirst({
        where: { storeId },
        include: {
          positions: {
            where: { positionId: data.positionId },
            include: { position: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (headcount && headcount.positions.length > 0) {
        const hp = headcount.positions[0];
        const available = hp.target - hp.current;
        if (data.quantity > available) {
          throw new BadRequestException(
            `Số lượng yêu cầu (${data.quantity}) vượt quá định biên còn lại (${available})`,
          );
        }
      }
    }

    // Auto-generate title if not provided
    let title = data.title;
    if (!title && storeId && data.positionId) {
      const store = await this.prisma.store.findUnique({ where: { id: storeId } });
      const position = await this.prisma.position.findUnique({ where: { id: data.positionId } });
      if (store && position) {
        title = `${store.code} - ${position.name} (${store.name})`;
      }
    }

    const proposal = await this.prisma.recruitmentProposal.create({
      data: {
        title: title || 'Đề xuất tuyển dụng',
        description: data.description,
        storeId,
        positionId: data.positionId,
        quantity: data.quantity || 1,
        reason: data.reason,
        businessReason: data.businessReason,
        replacementFor: data.replacementFor,
        urgency: data.urgency || 'NORMAL',
        budget: data.budget,
        targetJoinDate: data.targetJoinDate ? new Date(data.targetJoinDate) : null,
        isUnplanned: data.isUnplanned ?? false,
        status: 'DRAFT',
        requestedById: userId,
        departmentId: data.departmentId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isUntilFilled: data.isUntilFilled ?? false,
      },
    });

    // Create initial fulfillment tracking
    await this.prisma.proposalFulfillment.create({
      data: {
        proposalId: proposal.id,
        requestedQty: proposal.quantity,
      },
    });

    return proposal;
  }

  /**
   * Submit proposal (SM action)
   */
  async submitProposal(proposalId: string, userId: string, userRole: string) {
    const proposal = await this.getProposalWithAccess(proposalId, userId, userRole);

    if (proposal.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể gửi đề xuất ở trạng thái nháp');
    }

    // Check if user is the creator or has access
    if (userRole === 'USER' && proposal.requestedById !== userId) {
      throw new ForbiddenException('Bạn không có quyền gửi đề xuất này');
    }

    return this.transitionStatus(proposalId, 'SUBMITTED', userId, userRole, 'SM gửi đề xuất tuyển dụng');
  }

  /**
   * AM review proposal
   */
  async reviewProposal(proposalId: string, userId: string, userRole: string, notes?: string) {
    const proposal = await this.getProposalWithAccess(proposalId, userId, userRole);

    if (proposal.status !== 'SUBMITTED') {
      throw new BadRequestException('Đề xuất chưa được gửi');
    }

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      throw new ForbiddenException('Chỉ AM hoặc Admin có thể xem xét');
    }

    return this.transitionStatus(proposalId, 'AM_REVIEWED', userId, userRole, notes || 'AM xem xét đề xuất');
  }

  /**
   * HR accept proposal
   */
  async hrAcceptProposal(proposalId: string, userId: string, userRole: string, notes?: string) {
    const proposal = await this.getProposalWithAccess(proposalId, userId, userRole);

    if (proposal.status !== 'AM_REVIEWED') {
      throw new BadRequestException('Đề xuất chưa được AM xem xét');
    }

    if (!['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'].includes(userRole)) {
      throw new ForbiddenException('Chỉ HR/Admin có thể tiếp nhận');
    }

    return this.transitionStatus(proposalId, 'HR_ACCEPTED', userId, userRole, notes || 'HR tiếp nhận đề xuất');
  }

  /**
   * Final approval
   */
  async approveProposal(proposalId: string, userId: string, userRole: string) {
    const proposal = await this.getProposalWithAccess(proposalId, userId, userRole);

    if (!['HR_ACCEPTED', 'SUBMITTED'].includes(proposal.status)) {
      throw new BadRequestException('Đề xuất chưa sẵn sàng để duyệt');
    }

    if (!['ADMIN', 'HEAD_OF_DEPARTMENT'].includes(userRole)) {
      throw new ForbiddenException('Chỉ Admin/Head of Department có thể duyệt');
    }

    const updated = await this.transitionStatus(proposalId, 'APPROVED', userId, userRole, 'Đã duyệt đề xuất');

    // Reserve headcount
    await this.reserveHeadcount(proposal);

    return updated;
  }

  /**
   * Reject proposal
   */
  async rejectProposal(proposalId: string, userId: string, userRole: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Vui lòng cung cấp lý do từ chối');
    }

    const proposal = await this.getProposalWithAccess(proposalId, userId, userRole);

    if (['APPROVED', 'CANCELLED', 'REJECTED'].includes(proposal.status)) {
      throw new BadRequestException('Không thể từ chối đề xuất ở trạng thái này');
    }

    const updated = await this.prisma.recruitmentProposal.update({
      where: { id: proposalId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await this.logWorkflow(proposalId, proposal.status, 'REJECTED', 'REJECT', userId, userRole, reason);

    return updated;
  }

  /**
   * Cancel proposal
   */
  async cancelProposal(proposalId: string, userId: string, userRole: string) {
    const proposal = await this.getProposalWithAccess(proposalId, userId, userRole);

    if (proposal.status === 'CANCELLED') {
      throw new BadRequestException('Đề xuất đã bị hủy');
    }

    // SM can only cancel their own draft/submitted proposals
    if (userRole === 'USER' && proposal.requestedById !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy đề xuất này');
    }

    const updated = await this.prisma.recruitmentProposal.update({
      where: { id: proposalId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: userId,
      },
    });

    await this.logWorkflow(proposalId, proposal.status, 'CANCELLED', 'CANCEL', userId, userRole);

    // Release headcount reservation if any
    await this.releaseHeadcount(proposal);

    return updated;
  }

  /**
   * Get proposal with access check
   */
  private async getProposalWithAccess(proposalId: string, userId: string, userRole: string) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({
      where: { id: proposalId },
      include: {
        store: true,
        position: true,
        department: true,
        workflowHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        fulfillment: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException('Đề xuất không tồn tại');
    }

    if (userRole === 'ADMIN') return proposal;

    // Check store access
    if (userRole === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { managedStore: true },
      });
      if (user?.managedStore?.id !== proposal.storeId) {
        throw new ForbiddenException('Bạn không có quyền truy cập đề xuất này');
      }
    }

    if (userRole === 'MANAGER') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { managedStores: true },
      });
      const managedIds = user?.managedStores?.map(s => s.id) || [];
      if (!managedIds.includes(proposal.storeId || '')) {
        throw new ForbiddenException('Bạn không có quyền truy cập đề xuất này');
      }
    }

    return proposal;
  }

  private async transitionStatus(
    proposalId: string,
    toStatus: string,
    actorId: string,
    actorRole: string,
    notes?: string,
  ) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');

    const fromStatus = proposal.status;
    const allowedTransitions = PROPOSAL_STATUS_FLOW[fromStatus as keyof typeof PROPOSAL_STATUS_FLOW] || [];

    if (!allowedTransitions.includes(toStatus)) {
      throw new BadRequestException(`Không thể chuyển từ ${fromStatus} sang ${toStatus}`);
    }

    const updateData: any = { status: toStatus };
    if (toStatus === 'AM_REVIEWED') updateData.amReviewedAt = new Date();
    if (toStatus === 'HR_ACCEPTED') updateData.hrAssignedAt = new Date();
    if (toStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.approverId = actorId;
    }

    const updated = await this.prisma.recruitmentProposal.update({
      where: { id: proposalId },
      data: updateData,
    });

    await this.logWorkflow(proposalId, fromStatus, toStatus, this.getActionType(toStatus), actorId, actorRole, notes);

    return updated;
  }

  private getActionType(toStatus: string): string {
    const map: Record<string, string> = {
      SUBMITTED: 'SUBMIT',
      AM_REVIEWED: 'REVIEW',
      HR_ACCEPTED: 'ASSIGN',
      APPROVED: 'APPROVE',
      REJECTED: 'REJECT',
      CANCELLED: 'CANCEL',
    };
    return map[toStatus] || 'UPDATE';
  }

  private async logWorkflow(
    proposalId: string,
    fromStatus: string,
    toStatus: string,
    action: string,
    actorId: string,
    actorRole: string,
    notes?: string,
  ) {
    await this.prisma.proposalWorkflow.create({
      data: {
        proposalId,
        fromStatus,
        toStatus,
        action,
        actorId,
        actorRole,
        notes,
      },
    });
  }

  private async reserveHeadcount(proposal: any) {
    if (!proposal.storeId || !proposal.positionId) return;

    const headcount = await this.prisma.headcount.findFirst({
      where: { storeId: proposal.storeId },
      include: {
        positions: {
          where: { positionId: proposal.positionId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (headcount && headcount.positions.length > 0) {
      const hp = headcount.positions[0];
      await this.prisma.headcountPosition.update({
        where: { id: hp.id },
        data: { current: { increment: proposal.quantity } },
      });
    }
  }

  private async releaseHeadcount(proposal: any) {
    if (!proposal.storeId || !proposal.positionId) return;

    const headcount = await this.prisma.headcount.findFirst({
      where: { storeId: proposal.storeId },
      include: {
        positions: {
          where: { positionId: proposal.positionId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (headcount && headcount.positions.length > 0) {
      const hp = headcount.positions[0];
      await this.prisma.headcountPosition.update({
        where: { id: hp.id },
        data: { current: { decrement: proposal.quantity } },
      });
    }
  }

  /**
   * Get proposals with filters and pagination
   */
  async getProposals(filters?: {
    status?: string;
    storeId?: string;
    urgency?: string;
    userId?: string;
    userRole?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.storeId) where.storeId = filters.storeId;
    if (filters?.urgency) where.urgency = filters.urgency;

    // Role-based filtering
    if (filters?.userRole && filters.userRole !== 'ADMIN') {
      if (filters.userRole === 'USER') {
        where.requestedById = filters.userId;
      } else if (filters.userRole === 'MANAGER') {
        const user = await this.prisma.user.findUnique({
          where: { id: filters.userId },
          include: { managedStores: true },
        });
        const storeIds = user?.managedStores?.map(s => s.id) || [];
        where.storeId = { in: storeIds };
      }
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const proposals = await this.prisma.recruitmentProposal.findMany({
      where,
      include: {
        store: true,
        position: true,
        department: true,
        approver: { select: { id: true, fullName: true } },
        workflowHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
        fulfillment: true,
      },
      orderBy: [
        { urgency: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get counts - both direct proposalId and via campaign
    const proposalIds = proposals.map(p => p.id);
    const campaignIds = proposals.filter(p => p.campaignId).map(p => p.campaignId);
    
    const directCounts = await this.prisma.candidate.groupBy({
      by: ['proposalId'],
      _count: { id: true },
      where: { proposalId: { in: proposalIds } }
    });

    const campaignCounts = await this.prisma.candidate.groupBy({
      by: ['campaignId'],
      _count: { id: true },
      where: { campaign: { proposalId: { in: proposalIds } } }
    });

    const countMap: Record<string, number> = {};
    directCounts.forEach(c => {
      if (c.proposalId) countMap[c.proposalId] = (countMap[c.proposalId] || 0) + c._count.id;
    });
    campaignCounts.forEach(c => {
      const proposal = proposals.find(p => p.campaignId === c.campaignId);
      if (proposal) {
        countMap[proposal.id] = (countMap[proposal.id] || 0) + c._count.id;
      }
    });

    const proposalsWithCount = proposals.map(p => ({
      ...p,
      _count: { candidates: countMap[p.id] || 0 }
    }));

    const total = await this.prisma.recruitmentProposal.count({ where });

    return {
      data: proposalsWithCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single proposal with full details
   */
  async getProposal(id: string, userId?: string, userRole?: string) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({
      where: { id },
      include: {
        store: true,
        position: true,
        department: true,
        approver: { select: { id: true, fullName: true } },
        workflowHistory: {
          include: {
            actor: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        fulfillment: true,
        candidates: {
          include: {
            status: true,
            pic: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');

    // Access check
    if (userRole && userRole !== 'ADMIN') {
      if (userRole === 'USER' && proposal.requestedById !== userId) {
        throw new ForbiddenException();
      }
      if (userRole === 'MANAGER') {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { managedStores: true },
        });
        const managedIds = user?.managedStores?.map(s => s.id) || [];
        if (!managedIds.includes(proposal.storeId || '')) {
          throw new ForbiddenException();
        }
      }
    }

    return proposal;
  }
}

