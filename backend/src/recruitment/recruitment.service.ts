import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CandidateGateway } from './candidate.gateway';
import { CampaignService } from './campaign.service';
import { CandidateReadService } from './candidate-read.service';
import { CandidateWriteService } from './candidate-write.service';
import { ProposalService } from './proposal.service';
import { startOfMonth, subMonths, format } from 'date-fns';

@Injectable()
export class RecruitmentService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CandidateGateway)) private readonly candidateGateway: CandidateGateway,
    private campaignService: CampaignService,
    private candidateReadService: CandidateReadService,
    private candidateWriteService: CandidateWriteService,
    private proposalService: ProposalService,
  ) {}

  // Forms
  async getForms() {
    return this.prisma.recruitmentForm.findMany({
      include: {
        source: true,
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFormByLink(link: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { link },
      include: { source: true }
    });
    if (!form) throw new NotFoundException('Biểu mẫu không tồn tại');
    
    const fields = await this.prisma.formField.findMany({
      where: { formId: form.id, isActive: true },
      orderBy: { order: 'asc' }
    });
    
    return { ...form, fields };
  }

  async getForm(id: string) {
    const form = await this.prisma.recruitmentForm.findUnique({ 
      where: { id },
      include: { source: true }
    });
    if (!form) throw new NotFoundException('Biểu mẫu không tồn tại');
    
    const fields = await this.prisma.formField.findMany({
      where: { formId: form.id },
      orderBy: { order: 'asc' }
    });
    
    return { ...form, fields };
  }

  async createForm(data: any) {
    const { fields, ...formData } = data;
    const form = await this.prisma.recruitmentForm.create({
      data: { ...formData, isActive: true }
    });
    
    if (fields && fields.length > 0) {
      await this.prisma.formField.createMany({
        data: fields.map((f, i) => ({
          ...f,
          formId: form.id,
          order: f.order || i,
          isActive: true
        }))
      });
    }
    
    return this.getForm(form.id);
  }

  async updateForm(id: string, data: any) {
    const { fields, ...formData } = data;
    await this.prisma.recruitmentForm.update({
      where: { id },
      data: formData
    });
    
    if (fields) {
      await this.prisma.formField.deleteMany({ where: { formId: id } });
      if (fields.length > 0) {
        await this.prisma.formField.createMany({
          data: fields.map((f, i) => ({
            ...f,
            formId: id,
            order: f.order || i,
            isActive: true
          }))
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

    // Nếu form đang được dùng trong chiến dịch, không cho xóa để tránh lỗi ràng buộc
    if (form._count.campaigns > 0) {
      throw new BadRequestException(
        'Không thể xóa form đang được sử dụng trong chiến dịch. Vui lòng gỡ form khỏi chiến dịch trước.',
      );
    }

    // Nếu có ứng viên, ngắt liên kết thay vì chặn xóa
    if (form._count.candidates > 0) {
      await this.prisma.candidate.updateMany({
        where: { formId: id },
        data: { formId: null },
      });
    }

    // Xóa các field của form (do không có quan hệ Cascade trong Prisma schema hiện tại)
    await this.prisma.formField.deleteMany({
      where: { formId: id },
    });

    // Thực hiện Hard Delete theo quy tắc trong AGENTS.md
    return this.prisma.recruitmentForm.delete({
      where: { id },
    });
  }

  // Campaigns
  getCampaigns(user: any) { return this.campaignService.getCampaigns(user); }
  getCampaignByLink(link: string) { return this.campaignService.getCampaignByLink(link); }
  getCampaignStatistics(campaignId: string) { return this.campaignService.getCampaignStatistics(campaignId); }
  getCampaign(id: string, user: any) { return this.campaignService.getCampaign(id, user); }
  
  async createCampaign(data: any, user: any) {
    // Ensure formId is provided (required field)
    if (!data.formId) {
      // Try to get formId from proposal if proposalId is provided
      if (data.proposalId) {
        const proposal = await this.prisma.recruitmentProposal.findUnique({
          where: { id: data.proposalId },
          select: { storeId: true }
        });
        if (proposal?.storeId) {
          const existingCampaign = await this.prisma.campaign.findFirst({
            where: { storeId: proposal.storeId, formId: { not: null } },
            select: { formId: true },
          });
          if (existingCampaign?.formId) {
            data.formId = existingCampaign.formId;
          }
        }
      }
      
      // If still no formId, get the first active form
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

    const campaign = await this.prisma.campaign.create({
      data: {
        ...data,
        isActive: true,
        status: 'ACTIVE'
      }
    });
    return campaign;
  }

  async updateCampaign(id: string, data: any, user: any) {
    return this.prisma.campaign.update({
      where: { id },
      data
    });
  }

  async deleteCampaign(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }

  // Candidates
  getCandidates(query: any, user: any) { return this.candidateReadService.getCandidates(query, user); }
  getCandidate(id: string, user: any) { return this.candidateReadService.getCandidate(id, user); }
  updateCandidate(id: string, data: any, user: any) { return this.candidateWriteService.updateCandidate(id, data, user); }
  deleteCandidate(id: string, user: any) { return this.candidateWriteService.deleteCandidate(id, user); }
  transferCampaign(id: string, campaignId: string, user: any) { return this.candidateWriteService.transferCampaign(id, campaignId, user); }

  getTAs() { return this.candidateReadService.getTAs(); }
  assignPIC(id: string, picId: string) { return this.candidateWriteService.assignPIC(id, picId); }

  // Proposals
  getProposals(user: any) { 
    return this.proposalService.getProposals({ 
      userId: user.id, 
      userRole: user.role 
    }); 
  }
  
  async updateProposal(id: string, data: any, user: any) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');
    
    if (user.role !== 'ADMIN' && proposal.requestedById !== user.id) {
       throw new ForbiddenException('Bạn không có quyền chỉnh sửa đề xuất này');
    }
    
    if (proposal.status !== 'DRAFT' && user.role !== 'ADMIN') {
      throw new BadRequestException('Chỉ có thể chỉnh sửa đề xuất ở trạng thái nháp');
    }
    
    return this.prisma.recruitmentProposal.update({
      where: { id },
      data
    });
  }

  async deleteProposal(id: string, user: any) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');
    
    if (user.role !== 'ADMIN' && proposal.requestedById !== user.id) {
       throw new ForbiddenException('Bạn không có quyền xóa đề xuất này');
    }
    
    if (proposal.status !== 'DRAFT' && user.role !== 'ADMIN') {
      throw new BadRequestException('Chỉ có thể xóa đề xuất ở trạng thái nháp');
    }

    await this.prisma.proposalFulfillment.deleteMany({ where: { proposalId: id } });
    await this.prisma.proposalWorkflow.deleteMany({ where: { proposalId: id } });
    
    return this.prisma.recruitmentProposal.delete({ where: { id } });
  }

  // Headcounts
  async getHeadcounts() {
    return this.prisma.headcount.findMany({
      include: {
        store: true,
        positions: {
          include: { position: true }
        }
      }
    });
  }

  async createHeadcount(data: any) {
    const { positions, ...headcountData } = data;
    const headcount = await this.prisma.headcount.create({
      data: headcountData
    });
    
    if (positions && positions.length > 0) {
      await this.prisma.headcountPosition.createMany({
        data: positions.map(p => ({
          ...p,
          headcountId: headcount.id
        }))
      });
    }
    
    return headcount;
  }

  // Dashboard
  async getDashboard(filters: any) {
    const { campaignId, storeId, taId, statusId, dateFrom, dateTo } = filters;
    const where: any = { deletedAt: null };

    if (campaignId && campaignId !== 'ALL') where.campaignId = campaignId;
    if (taId && taId !== 'ALL') where.picId = taId;
    if (statusId && statusId !== 'ALL') where.statusId = statusId;
    
    if (storeId && storeId !== 'ALL') {
      if (storeId.startsWith('PROVINCE:')) {
        const provinceCode = storeId.replace('PROVINCE:', '');
        const stores = await this.prisma.store.findMany({ where: { provinceCode }, select: { id: true } });
        where.storeId = { in: stores.map(s => s.id) };
      } else {
        where.storeId = storeId;
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [totalCandidates, activeCampaigns, totalCampaigns, totalForms, statuses] = await Promise.all([
      this.prisma.candidate.count({ where }),
      this.prisma.campaign.count({ where: { isActive: true } }),
      this.prisma.campaign.count(),
      this.prisma.recruitmentForm.count({ where: { isActive: true } }),
      this.prisma.candidateStatus.findMany({ orderBy: { order: 'asc' } })
    ]);
    
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);

    const [newCandidatesThisMonth, newCandidatesLastMonth, candidatesByStatusRaw] = await Promise.all([
      this.prisma.candidate.count({
        where: { ...where, createdAt: { gte: startOfCurrentMonth } }
      }),
      this.prisma.candidate.count({
        where: { ...where, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
      }),
      this.prisma.candidate.groupBy({
        by: ['statusId'],
        where,
        _count: { id: true }
      })
    ]);

    const candidatesByStatus = statuses.map(s => {
      const countObj = candidatesByStatusRaw.find(r => r.statusId === s.id);
      return {
        statusId: s.id,
        statusCode: s.code,
        statusName: s.name,
        statusColor: s.color,
        count: countObj?._count?.id || 0,
        group: s.group
      };
    });

    // Campaign breakdown
    const candidatesByCampaignRaw = await this.prisma.candidate.groupBy({
      by: ['campaignId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const campaignIds = candidatesByCampaignRaw.map(r => r.campaignId).filter(Boolean);
    const campaigns = campaignIds.length ? await this.prisma.campaign.findMany({
      where: { id: { in: campaignIds as string[] } },
      include: { form: true }
    }) : [];

    const candidatesByCampaign = candidatesByCampaignRaw.map(r => {
      const campaign = campaigns.find(c => c.id === r.campaignId);
      return {
        campaignId: r.campaignId,
        campaignName: campaign?.name || 'Unknown',
        formName: campaign?.form?.title || 'Unknown',
        count: r._count.id
      };
    });

    // Store breakdown
    const candidatesByStoreRaw = await this.prisma.candidate.groupBy({
      by: ['storeId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const storeIds = candidatesByStoreRaw.map(r => r.storeId).filter(Boolean);
    const stores = storeIds.length ? await this.prisma.store.findMany({
      where: { id: { in: storeIds as string[] } }
    }) : [];

    const candidatesByStore = candidatesByStoreRaw.map(r => {
      const store = stores.find(s => s.id === r.storeId);
      return {
        storeId: r.storeId,
        storeName: store?.name || 'Unknown',
        storeCode: store?.code || 'N/A',
        count: r._count.id
      };
    });

    // Monthly data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = i === 0 ? now : new Date(startOfMonth(subMonths(now, i - 1)).getTime() - 1);
      
      const count = await this.prisma.candidate.count({
        where: { ...where, createdAt: { gte: start, lte: end } }
      });
      
      monthlyData.push({
        month: format(monthDate, 'MM/yyyy'),
        count
      });
    }

    // TA Performance
    const recruiters = await this.prisma.user.findMany({
      where: { role: 'RECRUITER', isActive: true }
    });

    const taPerformance = await Promise.all(recruiters.map(async (ta) => {
      const taWhere = { ...where, picId: ta.id };
      const [total, processed, achieved, onboarded] = await Promise.all([
        this.prisma.candidate.count({ where: taWhere }),
        // Processed: not statusId 1 (assuming 1 is CV_FILTERING or NEW)
        // Wait, better use code
        this.prisma.candidate.count({ 
          where: { ...taWhere, NOT: { status: { code: 'CV_FILTERING' } } } 
        }),
        // Achieved: status codes 10, 12, 15, 16, 17, 18, 19, 20 based on user requirement
        this.prisma.candidate.count({
          where: { 
            ...taWhere, 
            status: { 
              code: { 
                in: [
                  'HR_INTERVIEW_PASSED', 'SM_AM_INTERVIEW_PASSED', 'OM_PV_INTERVIEW_PASSED',
                  'OFFER_SENT', 'OFFER_ACCEPTED', 'WAITING_ONBOARDING', 'ONBOARDING_ACCEPTED'
                ] 
              } 
            } 
          }
        }),
        // Onboarded: status 20 (ONBOARDING_ACCEPTED)
        this.prisma.candidate.count({
          where: { ...taWhere, status: { code: 'ONBOARDING_ACCEPTED' } }
        })
      ]);
      
      return {
        taId: ta.id,
        taName: ta.fullName,
        taEmail: ta.email,
        taRole: ta.role,
        totalCandidates: total,
        processedCandidates: processed,
        achievedCandidates: achieved,
        onboardedCandidates: onboarded
      };
    }));

    // Funnel Data calculation - Dynamically group all statuses from DB by their group field
    const groups = [
      { key: 'application', label: 'Ứng tuyển' },
      { key: 'interview', label: 'Phỏng vấn' },
      { key: 'interviewing', label: 'Phỏng vấn' },
      { key: 'offer', label: 'Mời việc' },
      { key: 'onboarding', label: 'Nhận việc' },
    ];

    const funnelData = [];
    const processedGroups = new Set();

    // First add defined groups in order
    groups.forEach(g => {
      if (processedGroups.has(g.key)) return;
      
      const groupStatuses = candidatesByStatus.filter(s => s.group === g.key);
      if (groupStatuses.length > 0) {
        funnelData.push({ type: 'group', groupKey: g.key, groupLabel: g.label });
        groupStatuses.forEach(s => funnelData.push({ ...s, type: 'status' }));
        processedGroups.add(g.key);
      }
    });

    // Add any remaining groups from statuses not in the hardcoded list
    const remainingGroups = [...new Set(candidatesByStatus.map(s => s.group).filter(g => g && !processedGroups.has(g)))];
    remainingGroups.forEach(g => {
      const groupStatuses = candidatesByStatus.filter(s => s.group === g);
      funnelData.push({ type: 'group', groupKey: g, groupLabel: g.charAt(0).toUpperCase() + g.slice(1) });
      groupStatuses.forEach(s => funnelData.push({ ...s, type: 'status' }));
    });

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
      taPerformance,
      funnelData
    };
  }

  // Sources
  async getSources() { return this.prisma.source.findMany({ where: { isActive: true } }); }
  async getSource(id: string) { return this.prisma.source.findUnique({ where: { id } }); }
  async createSource(data: any) { return this.prisma.source.create({ data: { ...data, isActive: true } }); }
  async updateSource(id: string, data: any) { return this.prisma.source.update({ where: { id }, data }); }
  async deleteSource(id: string) { return this.prisma.source.update({ where: { id }, data: { isActive: false } }); }
  async getSourceByCode(code: string) { return this.prisma.source.findUnique({ where: { code } }); }

  // Public
  async getPublicStores() { return this.prisma.store.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true, provinceCode: true } }); }
  async getPublicPositions() { return this.prisma.position.findMany({ where: { isActive: true } }); }

  // Notifications
  async getNotifications(userId: string, unreadOnly: boolean) {
    const where: any = { recipientId: userId };
    if (unreadOnly) where.isRead = false;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markNotificationRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async getUnreadNotificationCount(userId: string) {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false }
    });
  }

  // Interviews
  async getInterviews() { return this.prisma.interview.findMany({ include: { candidate: true, interviewer: true } }); }
  async createInterview(data: any) { return this.prisma.interview.create({ data }); }
  async updateInterview(id: string, data: any) { return this.prisma.interview.update({ where: { id }, data }); }
}

