import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CandidateGateway } from './candidate.gateway';
import { CampaignService } from './campaign.service';
import { CandidateReadService } from './candidate-read.service';
import { CandidateWriteService } from './candidate-write.service';
import { ProposalService } from './proposal.service';
import { startOfMonth, subMonths, format } from 'date-fns';
import {
  PASSED_STATUS_CODES,
  CV_FILTERING_STATUS_CODE,
  ONBOARDED_STATUS_CODE,
  OFFER_SENT_STATUS_CODE,
  OFFER_ACCEPTED_STATUS_CODE,
} from './constants';
import { normalizeRole } from '../auth/role-utils';

// Types for dashboard
interface DashboardFilters {
  campaignId?: string;
  storeId?: string;
  taId?: string;
  statusId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class RecruitmentService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CandidateGateway))
    private readonly candidateGateway: CandidateGateway,
    private campaignService: CampaignService,
    private candidateReadService: CandidateReadService,
    private candidateWriteService: CandidateWriteService,
    private proposalService: ProposalService,
  ) {}

  // ==================== FORMS ====================
  async getForms() {
    return this.prisma.recruitmentForm.findMany({
      include: {
        source: true,
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFormByLink(link: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { link },
      include: { source: true },
    });
    if (!form) throw new NotFoundException('Biểu mẫu không tồn tại');

    const fields = await this.prisma.formField.findMany({
      where: { formId: form.id, isActive: true },
      orderBy: { order: 'asc' },
    });

    return { ...form, fields };
  }

  async getForm(id: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!form) throw new NotFoundException('Biểu mẫu không tồn tại');

    const fields = await this.prisma.formField.findMany({
      where: { formId: form.id },
      orderBy: { order: 'asc' },
    });

    return { ...form, fields };
  }

  async createForm(data: any) {
    const { fields, ...formData } = data;
    const form = await this.prisma.recruitmentForm.create({
      data: { ...formData, isActive: true },
    });

    if (fields && fields.length > 0) {
      await this.prisma.formField.createMany({
        data: fields.map((f, i) => ({
          ...f,
          formId: form.id,
          order: f.order || i,
          isActive: true,
        })),
      });
    }

    return this.getForm(form.id);
  }

  async updateForm(id: string, data: any) {
    const { fields, ...formData } = data;
    await this.prisma.recruitmentForm.update({
      where: { id },
      data: formData,
    });

    if (fields) {
      await this.prisma.formField.deleteMany({ where: { formId: id } });
      if (fields.length > 0) {
        await this.prisma.formField.createMany({
          data: fields.map((f, i) => ({
            ...f,
            formId: id,
            order: f.order || i,
            isActive: true,
          })),
        });
      }
    }

    return this.getForm(id);
  }

  async deleteForm(id: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true,
            campaigns: true,
          },
        },
      },
    });

    if (!form) throw new NotFoundException('Biểu mẫu không tồn tại');

    if (form._count.campaigns > 0) {
      throw new BadRequestException(
        'Không thể xóa form đang được sử dụng trong chiến dịch. Vui lòng gỡ form khỏi chiến dịch trước.',
      );
    }

    if (form._count.candidates > 0) {
      await this.prisma.candidate.updateMany({
        where: { formId: id },
        data: { formId: null },
      });
    }

    await this.prisma.formField.deleteMany({
      where: { formId: id },
    });

    return this.prisma.recruitmentForm.delete({
      where: { id },
    });
  }

  // ==================== CAMPAIGNS ====================
  getCampaigns(user: any) {
    return this.campaignService.getCampaigns(user);
  }

  getCampaignByLink(link: string) {
    return this.campaignService.getCampaignByLink(link);
  }

  getCampaignStatistics(campaignId: string) {
    return this.campaignService.getCampaignStatistics(campaignId);
  }

  getCampaign(id: string, user: any) {
    return this.campaignService.getCampaign(id, user);
  }

  async createCampaign(data: any, user: any) {
    if (!data.formId) {
      if (data.proposalId) {
        const proposal = await this.prisma.recruitmentProposal.findUnique({
          where: { id: data.proposalId },
          select: { storeId: true },
        });
        if (proposal?.storeId) {
          if (!data.storeId) {
            data.storeId = proposal.storeId;
          }
          const existingCampaign = await this.prisma.campaign.findFirst({
            where: { storeId: proposal.storeId },
            select: { formId: true },
          });
          if (existingCampaign?.formId) {
            data.formId = existingCampaign.formId;
          }
        }
      }

      if (!data.formId) {
        const defaultForm = await this.prisma.recruitmentForm.findFirst({
          where: { isActive: true },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        if (defaultForm) {
          data.formId = defaultForm.id;
        }
      }
    }

    const createData = { ...data };
    if (createData.quantity !== undefined) {
      createData.targetQty = createData.quantity;
      delete createData.quantity;
    }
    delete createData.picId;
    delete createData.recruiterId;

    const campaign = await this.prisma.campaign.create({
      data: {
        ...createData,
        isActive: true,
        status: 'ACTIVE',
      },
    });
    return campaign;
  }

  async updateCampaign(id: string, data: any, user: any) {
    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async deleteCampaign(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }

  // ==================== CANDIDATES ====================
  getCandidates(query: any, user: any) {
    return this.candidateReadService.getCandidates(query, user);
  }

  getCandidate(id: string, user: any) {
    return this.candidateReadService.getCandidate(id, user);
  }

  updateCandidate(id: string, data: any, user: any) {
    return this.candidateWriteService.updateCandidate(id, data, user);
  }

  deleteCandidate(id: string, user: any) {
    return this.candidateWriteService.deleteCandidate(id, user);
  }

  transferCampaign(id: string, campaignId: string, user: any) {
    return this.candidateWriteService.transferCampaign(id, campaignId, user);
  }

  getTAs() {
    return this.candidateReadService.getTAs();
  }

  getUsersForSelect(role?: string) {
    const normalizedRole = role ? (normalizeRole(role) ?? role) : undefined;
    const where: any = { isActive: true };
    if (normalizedRole) where.role = normalizedRole;

    return this.prisma.user.findMany({
      where,
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
    });
  }

  assignPIC(id: string, picId: string) {
    return this.candidateWriteService.assignPIC(id, picId);
  }

  // ==================== PROPOSALS ====================
  getProposals(user: any) {
    return this.proposalService.getProposals({
      userId: user.id,
      userRole: user.role,
    });
  }

  async updateProposal(id: string, data: any, user: any) {
    const proposal = await this.proposalService.getProposalForMutation(
      id,
      user.id,
      user.role,
    );

    const role = normalizeRole(user.role) ?? user.role;
    if (proposal.status !== 'DRAFT' && role !== 'ADMIN') {
      throw new BadRequestException(
        'Chỉ có thể chỉnh sửa đề xuất ở trạng thái nháp',
      );
    }

    return this.prisma.recruitmentProposal.update({
      where: { id },
      data,
    });
  }

  async deleteProposal(id: string, user: any) {
    const proposal = await this.proposalService.getProposalForMutation(
      id,
      user.id,
      user.role,
    );

    const role = normalizeRole(user.role) ?? user.role;
    if (proposal.status !== 'DRAFT' && role !== 'ADMIN') {
      throw new BadRequestException('Chỉ có thể xóa đề xuất ở trạng thái nháp');
    }

    await this.prisma.proposalFulfillment.deleteMany({
      where: { proposalId: id },
    });
    await this.prisma.proposalWorkflow.deleteMany({
      where: { proposalId: id },
    });

    return this.prisma.recruitmentProposal.delete({ where: { id } });
  }

  // ==================== HEADCOUNTS ====================
  async getHeadcounts() {
    return this.prisma.headcount.findMany({
      include: {
        store: true,
        positions: {
          include: { position: true },
        },
      },
    });
  }

  async createHeadcount(data: any) {
    const { positions, ...headcountData } = data;
    const headcount = await this.prisma.headcount.create({
      data: headcountData,
    });

    if (positions && positions.length > 0) {
      await this.prisma.headcountPosition.createMany({
        data: positions.map((p) => ({
          ...p,
          headcountId: headcount.id,
        })),
      });
    }

    return headcount;
  }

  // ==================== DASHBOARD ====================
  async getDashboard(filters: DashboardFilters) {
    // Build base where clause
    const where = this.buildCandidateWhere(filters);

    // Summary stats - parallel queries
    const [totalCandidates, activeCampaigns, totalCampaigns, totalForms] =
      await Promise.all([
        this.prisma.candidate.count({ where }),
        this.prisma.campaign.count({ where: { isActive: true } }),
        this.prisma.campaign.count(),
        this.prisma.recruitmentForm.count({ where: { isActive: true } }),
      ]);

    // Time-based comparisons
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);

    const [newCandidatesThisMonth, newCandidatesLastMonth] = await Promise.all([
      this.prisma.candidate.count({
        where: { ...where, createdAt: { gte: startOfCurrentMonth } },
      }),
      this.prisma.candidate.count({
        where: {
          ...where,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
    ]);

    // Use helper methods for grouping
    const candidatesByStatus = await this.getCandidatesByStatus(where);
    const candidatesByCampaign = await this.getCandidatesGroupBy(
      'campaignId',
      where,
      true,
    );
    const candidatesByStore = await this.getCandidatesGroupBy(
      'storeId',
      where,
      false,
    );
    const monthlyData = await this.getMonthlyData(where, 6);

    // Proposal statistics
    const proposalWhere = this.buildProposalWhere(filters);
    const proposalCandidateWhere = this.buildProposalCandidateWhere(filters);
    const candidatesByProposal = await this.getCandidatesByProposal(
      proposalWhere,
      proposalCandidateWhere,
    );

    // TA Performance
    const taPerformance = await this.getTAPerformance(where);

    // Funnel data
    const funnelData = this.buildFunnelData(candidatesByStatus);

    return {
      totalCandidates,
      newCandidatesThisMonth,
      newCandidatesLastMonth,
      activeCampaigns,
      totalCampaigns,
      totalForms,
      candidatesByStatus,
      candidatesByCampaign,
      monthlyData,
      candidatesByStore,
      candidatesByProposal,
      taPerformance,
      funnelData,
    };
  }

  // ==================== DASHBOARD HELPER METHODS ====================
  private buildCandidateWhere(filters: DashboardFilters): any {
    const where: any = {};

    if (filters.campaignId && filters.campaignId !== 'ALL') {
      where.campaignId = filters.campaignId;
    }
    if (filters.taId && filters.taId !== 'ALL') {
      where.picId = filters.taId;
    }
    if (filters.statusId && filters.statusId !== 'ALL') {
      where.statusId = filters.statusId;
    }
    if (filters.storeId && filters.storeId !== 'ALL') {
      where.storeId = filters.storeId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return where;
  }

  private async buildProposalWhere(filters: DashboardFilters): Promise<any> {
    const where: any = {};

    if (filters.storeId && filters.storeId !== 'ALL') {
      if (filters.storeId.startsWith('PROVINCE:')) {
        const provinceCode = filters.storeId.replace('PROVINCE:', '');
        const stores = await this.prisma.store.findMany({
          where: { provinceCode },
          select: { id: true },
        });
        where.storeId = { in: stores.map((s) => s.id) };
      } else {
        where.storeId = filters.storeId;
      }
    }

    if (filters.campaignId && filters.campaignId !== 'ALL') {
      where.campaignId = filters.campaignId;
    }

    return where;
  }

  private buildProposalCandidateWhere(filters: DashboardFilters): any {
    const where: any = {};

    if (filters.taId && filters.taId !== 'ALL') {
      where.picId = filters.taId;
    }
    if (filters.statusId && filters.statusId !== 'ALL') {
      where.statusId = filters.statusId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return where;
  }

  private async getCandidatesByStatus(where: any) {
    const statuses = await this.prisma.candidateStatus.findMany({
      orderBy: { order: 'asc' },
    });

    const candidatesByStatusRaw = await this.prisma.candidate.groupBy({
      by: ['statusId'],
      where,
      _count: { id: true },
    });

    return statuses.map((s) => {
      const countObj = candidatesByStatusRaw.find((r) => r.statusId === s.id);
      return {
        statusId: s.id,
        statusCode: s.code,
        statusName: s.name,
        statusColor: s.color,
        count: countObj?._count?.id || 0,
        group: s.group,
      };
    });
  }

  private async getCandidatesGroupBy(
    groupBy: 'campaignId' | 'storeId',
    where: any,
    includeForm: boolean,
  ) {
    const rawData = await this.prisma.candidate.groupBy({
      by: [groupBy],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const ids = rawData.map((r) => r[groupBy]).filter(Boolean);

    if (ids.length === 0) return [];

    let relatedItems: any[] = [];
    if (groupBy === 'campaignId') {
      relatedItems = await this.prisma.campaign.findMany({
        where: { id: { in: ids as string[] } },
        include: includeForm ? { form: true } : undefined,
      });
    } else {
      relatedItems = await this.prisma.store.findMany({
        where: { id: { in: ids as string[] } },
      });
    }

    return rawData.map((r) => {
      const related = relatedItems.find((item) => item.id === r[groupBy]);
      if (groupBy === 'campaignId') {
        return {
          campaignId: r.campaignId,
          campaignName: related?.name || 'Unknown',
          formName: related?.form?.title || 'Unknown',
          count: r._count.id,
        };
      }
      return {
        storeId: r.storeId,
        storeName: related?.name || 'Unknown',
        storeCode: related?.code || 'N/A',
        count: r._count.id,
      };
    });
  }

  private async getMonthlyData(where: any, months: number) {
    const monthlyData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end =
        i === 0
          ? now
          : new Date(startOfMonth(subMonths(now, i - 1)).getTime() - 1);

      const count = await this.prisma.candidate.count({
        where: { ...where, createdAt: { gte: start, lte: end } },
      });

      monthlyData.push({
        month: format(monthDate, 'MM/yyyy'),
        count,
      });
    }

    return monthlyData;
  }

  private async getCandidatesByProposal(
    proposalWhere: any,
    candidateWhere: any,
  ) {
    const proposalsRaw = await this.prisma.recruitmentProposal.findMany({
      where: proposalWhere,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const proposalsWithCandidates = await Promise.all(
      proposalsRaw.map(async (p) => {
        const candidates = await this.prisma.candidate.findMany({
          where: {
            recruitmentProposalId: p.id,
            ...candidateWhere,
          },
          select: { id: true, status: { select: { code: true } } },
        });
        return { ...p, candidates };
      }),
    );

    return proposalsWithCandidates.map((p) => {
      const passedCount = p.candidates.filter((c) =>
        (PASSED_STATUS_CODES as readonly string[]).includes(
          c.status?.code || '',
        ),
      ).length;
      const acceptedCount = p.candidates.filter(
        (c) => c.status?.code === ONBOARDED_STATUS_CODE,
      ).length;

      return {
        proposalId: p.id,
        proposalTitle: p.title || 'Unknown',
        quantity: p.quantity || 0,
        candidateCount: p.candidates.length,
        passedCount,
        acceptedCount,
      };
    });
  }

  private async getTAPerformance(baseWhere: any) {
    const picIds = await this.prisma.candidate.findMany({
      where: { picId: { not: null } },
      select: { picId: true },
      distinct: ['picId'],
    });

    const recruiters = await this.prisma.user.findMany({
      where: {
        id: { in: picIds.map((p) => p.picId as string) },
        role: 'RECRUITER',
        isActive: true,
      },
    });

    const taPerformance = await Promise.all(
      recruiters.map(async (ta) => {
        const taWhere = { ...baseWhere, picId: ta.id };

        const [
          total,
          processed,
          achieved,
          onboarded,
          offerSent,
          offerAccepted,
        ] = await Promise.all([
          this.prisma.candidate.count({ where: taWhere }),
          this.prisma.candidate.count({
            where: {
              ...taWhere,
              NOT: { status: { code: CV_FILTERING_STATUS_CODE } },
            },
          }),
          this.prisma.candidate.count({
            where: {
              ...taWhere,
              status: { code: { in: PASSED_STATUS_CODES } },
            },
          }),
          this.prisma.candidate.count({
            where: { ...taWhere, status: { code: ONBOARDED_STATUS_CODE } },
          }),
          this.prisma.candidate.count({
            where: { ...taWhere, status: { code: OFFER_SENT_STATUS_CODE } },
          }),
          this.prisma.candidate.count({
            where: { ...taWhere, status: { code: OFFER_ACCEPTED_STATUS_CODE } },
          }),
        ]);

        return {
          taId: ta.id,
          taName: ta.fullName,
          taEmail: ta.email,
          taRole: ta.role,
          totalCandidates: total,
          processedCandidates: processed,
          passedCandidates: achieved,
          onboardedCandidates: onboarded,
          offerSentCandidates: offerSent,
          offerAcceptedCandidates: offerAccepted,
        };
      }),
    );

    return taPerformance;
  }

  private buildFunnelData(candidatesByStatus: any[]) {
    const groups = [
      { key: 'application', label: 'Ứng tuyển' },
      { key: 'interview', label: 'Phỏng vấn' },
      { key: 'interviewing', label: 'Phỏng vấn' },
      { key: 'offer', label: 'Mời việc' },
      { key: 'onboarding', label: 'Nhận việc' },
    ];

    const funnelData: any[] = [];
    const processedGroups = new Set();

    groups.forEach((g) => {
      if (processedGroups.has(g.key)) return;

      const groupStatuses = candidatesByStatus.filter((s) => s.group === g.key);
      if (groupStatuses.length > 0) {
        funnelData.push({
          type: 'group',
          groupKey: g.key,
          groupLabel: g.label,
        });
        groupStatuses.forEach((s) => funnelData.push({ ...s, type: 'status' }));
        processedGroups.add(g.key);
      }
    });

    const remainingGroups = [
      ...new Set(
        candidatesByStatus
          .map((s) => s.group)
          .filter((g) => g && !processedGroups.has(g)),
      ),
    ];

    remainingGroups.forEach((g) => {
      const groupStatuses = candidatesByStatus.filter((s) => s.group === g);
      funnelData.push({
        type: 'group',
        groupKey: g,
        groupLabel: g.charAt(0).toUpperCase() + g.slice(1),
      });
      groupStatuses.forEach((s) => funnelData.push({ ...s, type: 'status' }));
    });

    return funnelData;
  }

  // ==================== SOURCES ====================
  async getSources() {
    return this.prisma.source.findMany({ orderBy: { name: 'asc' } });
  }

  async getSource(id: string) {
    return this.prisma.source.findUnique({ where: { id } });
  }

  async createSource(data: any) {
    return this.prisma.source.create({ data: { ...data, isActive: true } });
  }

  async updateSource(id: string, data: any) {
    return this.prisma.source.update({ where: { id }, data });
  }

  async deleteSource(id: string) {
    return this.prisma.source.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getSourceByCode(code: string) {
    return this.prisma.source.findUnique({ where: { code } });
  }

  // ==================== STATUSES ====================
  async getStatuses() {
    return this.prisma.candidateStatus.findMany({ orderBy: { order: 'asc' } });
  }

  async getStatus(id: string) {
    return this.prisma.candidateStatus.findUnique({ where: { id } });
  }

  async createStatus(data: any) {
    return this.prisma.candidateStatus.create({
      data: { ...data, isActive: true },
    });
  }

  async updateStatus(id: string, data: any) {
    return this.prisma.candidateStatus.update({ where: { id }, data });
  }

  async deleteStatus(id: string) {
    return this.prisma.candidateStatus.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== PUBLIC ENDPOINTS ====================
  async getPublicStores() {
    return this.prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        provinceCode: true,
        province: { select: { code: true, name: true } },
      },
    });
  }

  async getPublicPositions() {
    return this.prisma.position.findMany({ where: { isActive: true } });
  }

  // ==================== NOTIFICATIONS ====================
  async getNotifications(userId: string, unreadOnly: boolean) {
    const where: any = { recipientId: userId };
    if (unreadOnly) where.isRead = false;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadNotificationCount(userId: string) {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  // ==================== INTERVIEWS ====================
  async createInterview(data: any) {
    return this.prisma.interview.create({ data });
  }

  async updateInterview(id: string, data: any) {
    return this.prisma.interview.update({ where: { id }, data });
  }
}
