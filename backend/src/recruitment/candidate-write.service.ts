import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_SMAM_RESULTS = [
  'SM_AM_INTERVIEW_PASSED',
  'SM_AM_INTERVIEW_FAILED', 
  'SM_AM_NO_SHOW',
  'OM_PV_INTERVIEW_PASSED',
  'OM_PV_INTERVIEW_FAILED',
  'OM_PV_NO_SHOW',
];

@Injectable()
export class CandidateWriteService {
  constructor(private prisma: PrismaService) {}

  async createCandidate(data: any, user?: any) {
    // Blacklist check
    if (data.phone || data.email) {
      const blacklistEntry = await this.checkBlacklist(data.phone, data.email);
      if (blacklistEntry) {
        throw new ForbiddenException(
          `Ứng viên nằm trong danh sách đen. Lý do: ${blacklistEntry.reason}`
        );
      }
    }

    const status = await this.prisma.candidateStatus.findUnique({
      where: { code: data.status || 'CV_FILTERING' }
    });
    
    let sourceId = data.sourceId;
    if (data.sourceCode && !sourceId) {
      const source = await this.prisma.source.findUnique({
        where: { code: data.sourceCode }
      });
      if (source) sourceId = source.id;
    }
    
    // Calculate SLA due date
    const slaDueDate = status?.slaHours 
      ? new Date(Date.now() + status.slaHours * 60 * 60 * 1000)
      : null;
    
    const { status: statusName, sourceCode, ...rest } = data;
    
    const candidate = await this.prisma.candidate.create({
      data: {
        ...rest,
        sourceId,
        statusId: status?.id,
        slaDueDate,
        priority: data.priority || 'NORMAL',
      }
    });

    // Create initial SLA log
    if (status) {
      await this.prisma.candidateSLALog.create({
        data: {
          candidateId: candidate.id,
          statusCode: status.code,
          enteredAt: new Date(),
          slaHours: status.slaHours || 0,
        }
      });
    }

    // Create initial audit log
    await this.prisma.candidateAuditLog.create({
      data: {
        candidateId: candidate.id,
        actorId: user?.id,
        action: 'CANDIDATE_CREATED',
        toValue: status?.name || 'CV_FILTERING',
        notes: data.sourceCode ? `Nguồn: ${data.sourceCode}` : null,
      }
    });

    return candidate;
  }

  async updateCandidate(id: string, data: any, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({ 
      where: { id },
      include: { status: true }
    });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);
      const isFromUserProposal = candidate.campaignId && campaignIdsFromUserProposals.includes(candidate.campaignId);

      const hasAccess = candidate.picId === user.id ||
        (candidate.storeId && storeIds.includes(candidate.storeId)) ||
        isFromUserProposal;

      if (!hasAccess) {
        throw new ForbiddenException('Bạn không có quyền cập nhật ứng viên này');
      }

      if (data.status && !ALLOWED_SMAM_RESULTS.includes(data.status)) {
        throw new ForbiddenException('Bạn không có quyền cập nhật trạng thái này');
      }
    }

    const updateData: any = { ...data };
    
    if (data.status) {
      const status = await this.prisma.candidateStatus.findUnique({
        where: { code: data.status }
      });
      if (status) {
        updateData.statusId = status.id;
        if (status.slaHours) {
          updateData.slaDueDate = new Date(Date.now() + status.slaHours * 60 * 60 * 1000);
        }
      }
    }

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    // Log status change
    if (data.status && data.status !== candidate.status?.code) {
      await this.prisma.candidateAuditLog.create({
        data: {
          candidateId: id,
          actorId: user?.id,
          action: 'STATUS_CHANGED',
          fromValue: candidate.status?.code,
          toValue: data.status,
        }
      });
    }

    return updated;
  }

  async deleteCandidate(id: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);
      const isFromUserProposal = candidate.campaignId && campaignIdsFromUserProposals.includes(candidate.campaignId);

      const hasAccess = candidate.picId === user.id ||
        (candidate.storeId && storeIds.includes(candidate.storeId)) ||
        isFromUserProposal;

      if (!hasAccess) {
        throw new ForbiddenException('Bạn không có quyền xóa ứng viên này');
      }
    }

    return this.prisma.candidate.delete({ where: { id } });
  }

  async assignPIC(candidateId: string, picId: string) {
    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: { picId }
    });
  }

  async transferCampaign(candidateId: string, campaignId: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại');

    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException('Chỉ có thể chuyển ứng viên vào chiến dịch đang hoạt động (ACTIVE)');
    }

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!campaign.storeId || !storeIds.includes(campaign.storeId)) {
        throw new ForbiddenException('Bạn không có quyền chuyển ứng viên sang chiến dịch này');
      }
    }

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { campaignId },
    });

    await this.prisma.candidateAuditLog.create({
      data: {
        candidateId,
        actorId: user?.id,
        action: 'CAMPAIGN_TRANSFERRED',
        notes: `Chuyển sang chiến dịch: ${campaign.name}`,
      }
    });

    return updated;
  }

  private async checkBlacklist(phone?: string, email?: string) {
    if (!phone && !email) return null;
    
    const where: any[] = [];
    if (phone) where.push({ phone });
    if (email) where.push({ email });
    
    const blacklistEntry = await this.prisma.blacklist.findFirst({
      where: {
        OR: where,
        AND: [
          {
            OR: [
              { isPermanent: true },
              { expiryDate: { gt: new Date() } }
            ]
          }
        ]
      }
    });
    
    return blacklistEntry;
  }

  private async getAccessibleStoreIds(user: any): Promise<string[]> {
    if (!user || user.role === 'ADMIN') {
      const stores = await this.prisma.store.findMany({ select: { id: true } });
      return stores.map(s => s.id);
    }

    if (user.role === 'USER') {
      const u = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { managedStore: { select: { id: true } } }
      });
      return u?.managedStore ? [u.managedStore.id] : [];
    }

    if (user.role === 'MANAGER') {
      const u = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { managedStores: { select: { id: true } } }
      });
      return u?.managedStores?.map(s => s.id) || [];
    }

    return [];
  }

  /**
   * Get campaign IDs from proposals created by the user
   * This allows proposal creators to update/delete candidates in campaigns from their proposals
   */
  private async getCampaignIdsFromUserProposals(userId: string): Promise<string[]> {
    const proposals = await this.prisma.recruitmentProposal.findMany({
      where: { requestedById: userId },
      select: { campaignId: true }
    });
    return proposals
      .map(p => p.campaignId)
      .filter((id): id is string => id !== null);
  }
}