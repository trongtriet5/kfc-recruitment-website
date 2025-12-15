import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { CreateRecruitmentFormDto } from './dto/create-recruitment-form.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { CreateHeadcountDto } from './dto/create-headcount.dto';
import { ApplyCandidateDto } from './dto/apply-candidate.dto';
import { CreateFormFieldDto } from './dto/create-form-field.dto';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // ============ Recruitment Forms ============
  async createForm(createDto: CreateRecruitmentFormDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HEAD_OF_DEPARTMENT can create forms');
    }

    // Generate link if not provided
    let link = createDto.link;
    if (!link) {
      const linkBase = createDto.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      link = linkBase;
      let counter = 1;
      while (await this.prisma.recruitmentForm.findUnique({ where: { link } })) {
        link = `${linkBase}-${counter}`;
        counter++;
      }
    }

    const { fields, ...formData } = createDto;

    const form = await this.prisma.recruitmentForm.create({
      data: {
        ...formData,
        link,
        fields: fields
          ? {
              create: fields.map((field, index) => ({
                ...field,
                order: field.order ?? index,
                options: field.options ? JSON.parse(JSON.stringify(field.options)) : null,
              })),
            }
          : undefined,
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return form;
  }

  async getForms(user: User) {
    return this.prisma.recruitmentForm.findMany({
      include: {
        fields: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForm(id: string, user: User) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { id },
      include: {
        campaigns: true,
        candidates: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        fields: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  async updateForm(id: string, updateDto: Partial<CreateRecruitmentFormDto>, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can update forms');
    }

    const form = await this.prisma.recruitmentForm.findUnique({ where: { id } });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const { fields, ...formData } = updateDto;

    // Update form fields if provided
    if (fields !== undefined) {
      // Delete all existing fields
      await this.prisma.formField.deleteMany({
        where: { formId: id },
      });

      // Create new fields
      if (fields.length > 0) {
        await this.prisma.formField.createMany({
          data: fields.map((field, index) => ({
            formId: id,
            ...field,
            order: field.order ?? index,
            options: field.options ? JSON.parse(JSON.stringify(field.options)) : null,
          })),
        });
      }
    }

    return this.prisma.recruitmentForm.update({
      where: { id },
      data: formData,
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deleteForm(id: string, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can delete forms');
    }

    const form = await this.prisma.recruitmentForm.findUnique({ where: { id } });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Check if form has associated campaigns or candidates
    const campaignCount = await this.prisma.campaign.count({
      where: { formId: id },
    });
    const candidateCount = await this.prisma.candidate.count({
      where: { formId: id },
    });

    if (campaignCount > 0 || candidateCount > 0) {
      throw new BadRequestException(
        'Không thể xóa form đã có chiến dịch hoặc ứng viên liên kết',
      );
    }

    return this.prisma.recruitmentForm.delete({
      where: { id },
    });
  }

  async getFormByLink(link: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { link },
      include: {
        fields: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  async getFormByLinkOld(link: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { link },
      include: {
        campaigns: {
          where: {
            isActive: true,
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (!form.isActive) {
      throw new BadRequestException('Form is not active');
    }

    return form;
  }

  // ============ Campaigns ============
  async createCampaign(createDto: CreateCampaignDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can create campaigns');
    }

    // Verify form exists
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { id: createDto.formId },
    });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // If proposalId is provided, verify proposal exists and is approved
    if (createDto.proposalId) {
      const proposal = await this.prisma.recruitmentProposal.findUnique({
        where: { id: createDto.proposalId },
        include: { status: true },
      });
      if (!proposal) {
        throw new NotFoundException('Proposal not found');
      }
      const statusCode = proposal.status?.code;
      if (statusCode !== 'APPROVED') {
        throw new BadRequestException('Chỉ có thể tạo chiến dịch cho đề xuất đã được duyệt');
      }
      if (proposal.campaignId) {
        throw new BadRequestException('Đề xuất này đã có chiến dịch');
      }
    }

    // Generate unique link for campaign
    const linkBase = createDto.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let link = linkBase;
    let counter = 1;
    while (await this.prisma.campaign.findUnique({ where: { link } })) {
      link = `${linkBase}-${counter}`;
      counter++;
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        formId: createDto.formId,
        link,
        startDate: new Date(createDto.startDate),
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
        isActive: createDto.isActive !== undefined ? createDto.isActive : true,
      },
      include: {
        form: true,
      },
    });

    // Update proposal with campaignId
    if (createDto.proposalId) {
      await this.prisma.recruitmentProposal.update({
        where: { id: createDto.proposalId },
        data: { campaignId: campaign.id },
      });
      
      // Reload campaign with proposal
      return this.prisma.campaign.findUnique({
        where: { id: campaign.id },
        include: {
          form: true,
          proposal: {
            include: {
              store: true,
              position: true,
            },
          },
        },
      });
    }

    return campaign;
  }

  async getCampaigns(user: User, filters?: { formId?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.formId) where.formId = filters.formId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.campaign.findMany({
      where,
      include: {
        form: true,
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string, user: User) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        form: true,
        candidates: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async getCampaignByLink(link: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { link },
      include: {
        form: {
          include: {
            campaigns: {
              where: {
                isActive: true,
                OR: [
                  { endDate: null },
                  { endDate: { gte: new Date() } },
                ],
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.isActive) {
      throw new BadRequestException('Campaign is not active');
    }

    // Check if campaign is still valid (within date range)
    const now = new Date();
    if (campaign.startDate > now) {
      throw new BadRequestException('Campaign has not started yet');
    }
    if (campaign.endDate && campaign.endDate < now) {
      throw new BadRequestException('Campaign has ended');
    }

    if (!campaign.form.isActive) {
      throw new BadRequestException('Form is not active');
    }

    return campaign;
  }

  async getCampaignStatistics(campaignId?: string) {
    const where: any = {};
    if (campaignId) {
      where.campaignId = campaignId;
    }

    const [
      totalCandidates,
      candidatesByStatus,
      candidatesByCampaign,
    ] = await Promise.all([
      this.prisma.candidate.count({ where }),
      this.prisma.candidate.groupBy({
        by: ['statusId'],
        where,
        _count: true,
      }),
      campaignId
        ? null
        : this.prisma.candidate.groupBy({
            by: ['campaignId'],
            where: { campaignId: { not: null } },
            _count: true,
          }),
    ]);

    return {
      totalCandidates,
      candidatesByStatus,
      candidatesByCampaign,
    };
  }

  async getDashboard(user: User) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get status type IDs
    const statusCategory = await this.prisma.typeCategory.findUnique({
      where: { code: 'CANDIDATE_STATUS' },
    });

    if (!statusCategory) {
      throw new NotFoundException('Candidate status category not found');
    }

    const statusTypes = await this.prisma.type.findMany({
      where: { categoryId: statusCategory.id, isActive: true },
      orderBy: { order: 'asc' },
    });

    // Get all candidates with status
    const allCandidates = await this.prisma.candidate.findMany({
      include: {
        status: true,
        campaign: {
          include: {
            form: true,
          },
        },
        store: true,
      },
    });

    // Calculate statistics
    const totalCandidates = allCandidates.length;
    const newCandidatesThisMonth = allCandidates.filter(
      (c) => c.createdAt >= startOfThisMonth
    ).length;
    const newCandidatesLastMonth = allCandidates.filter(
      (c) => c.createdAt >= startOfLastMonth && c.createdAt <= endOfLastMonth
    ).length;

    // Group by status
    const candidatesByStatus = statusTypes.map((status) => {
      const count = allCandidates.filter(
        (c) => c.statusId === status.id
      ).length;
      return {
        statusId: status.id,
        statusCode: status.code,
        statusName: status.name,
        statusColor: status.color,
        count,
      };
    });

    // Group by campaign
    const candidatesByCampaign = await this.prisma.candidate.groupBy({
      by: ['campaignId'],
      where: { campaignId: { not: null } },
      _count: true,
    });

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        id: { in: candidatesByCampaign.map((c) => c.campaignId!).filter(Boolean) },
      },
      include: {
        form: true,
      },
    });

    const campaignStats = campaigns.map((campaign) => {
      const count = candidatesByCampaign.find((c) => c.campaignId === campaign.id)?._count || 0;
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        formName: campaign.form.title,
        count,
      };
    });

    // Group by month (last 6 months)
    const monthlyData: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const count = allCandidates.filter(
        (c) => c.createdAt >= monthStart && c.createdAt <= monthEnd
      ).length;

      monthlyData.push({
        month: `${date.getMonth() + 1}/${date.getFullYear()}`,
        count,
      });
    }

    // Group by brand
    const candidatesByBrand = await this.prisma.candidate.groupBy({
      by: ['brand'],
      _count: true,
    });

    // Group by store
    const candidatesByStore = await this.prisma.candidate.groupBy({
      by: ['storeId'],
      where: { storeId: { not: null } },
      _count: true,
    });

    const stores = await this.prisma.store.findMany({
      where: {
        id: { in: candidatesByStore.map((s) => s.storeId!).filter(Boolean) },
      },
    });

    const storeStats = stores.map((store) => {
      const count = candidatesByStore.find((s) => s.storeId === store.id)?._count || 0;
      return {
        storeId: store.id,
        storeName: store.name,
        count,
      };
    });

    // Group statuses by process (application, interview, offer, onboarding)
    const groupStatusByProcess = (code: string): string => {
      if (code.startsWith('CV_') || code === 'BLACKLIST' || code === 'CANNOT_CONTACT' || code === 'AREA_NOT_RECRUITING') {
        return 'application';
      } else if (code.includes('INTERVIEW') || code === 'WAITING_INTERVIEW') {
        return 'interview';
      } else if (code.startsWith('OFFER_')) {
        return 'offer';
      } else if (code.includes('ONBOARDING') || code === 'WAITING_ONBOARDING') {
        return 'onboarding';
      }
      return 'application'; // Default
    };

    const processGroups: Record<string, { label: string; statuses: typeof statusTypes }> = {
      application: { label: 'Ứng tuyển', statuses: [] },
      interview: { label: 'Phỏng vấn', statuses: [] },
      offer: { label: 'Thư mời', statuses: [] },
      onboarding: { label: 'Trúng tuyển', statuses: [] },
    };

    // Group statuses by process
    statusTypes.forEach((status) => {
      const group = groupStatusByProcess(status.code);
      if (processGroups[group]) {
        processGroups[group].statuses.push(status);
      }
    });

    // Sort statuses within each group by order
    Object.keys(processGroups).forEach((key) => {
      processGroups[key].statuses.sort((a, b) => a.order - b.order);
    });

    // Build funnel data with groups
    // Logic: Candidates ở bước sau cũng được tính vào các bước trước (cumulative)
    const funnelData: Array<{
      type: 'group' | 'status';
      groupKey?: string;
      groupLabel?: string;
      statusId?: string;
      statusCode?: string;
      statusName?: string;
      statusColor?: string | null;
      count?: number;
      previousCount?: number;
      conversionRate?: number;
    }> = [];

    // Helper function to get cumulative count for a group
    // Returns count of candidates in this group OR any later groups
    const getGroupCumulativeCount = (groupKey: string): number => {
      const groupOrder = ['application', 'interview', 'offer', 'onboarding'];
      const currentIndex = groupOrder.indexOf(groupKey);
      if (currentIndex === -1) return 0;

      // Count candidates in this group and all later groups
      let count = 0;
      for (let i = currentIndex; i < groupOrder.length; i++) {
        const laterGroupKey = groupOrder[i];
        const laterGroup = processGroups[laterGroupKey];
        if (laterGroup) {
          laterGroup.statuses.forEach((status) => {
            count += allCandidates.filter((c) => c.statusId === status.id).length;
          });
        }
      }
      return count;
    };

    // Helper function to get cumulative count for a status
    // Returns count of candidates in this status OR any later statuses in same group OR any later groups
    const getStatusCumulativeCount = (statusId: string, groupKey: string, statusIndex: number): number => {
      const groupOrder = ['application', 'interview', 'offer', 'onboarding'];
      const currentGroupIndex = groupOrder.indexOf(groupKey);
      if (currentGroupIndex === -1) return 0;

      const currentGroup = processGroups[groupKey];
      if (!currentGroup) return 0;

      let count = 0;

      // Count candidates in this status and later statuses in same group
      for (let i = statusIndex; i < currentGroup.statuses.length; i++) {
        const laterStatus = currentGroup.statuses[i];
        count += allCandidates.filter((c) => c.statusId === laterStatus.id).length;
      }

      // Count candidates in all later groups
      for (let i = currentGroupIndex + 1; i < groupOrder.length; i++) {
        const laterGroupKey = groupOrder[i];
        const laterGroup = processGroups[laterGroupKey];
        if (laterGroup) {
          laterGroup.statuses.forEach((status) => {
            count += allCandidates.filter((c) => c.statusId === status.id).length;
          });
        }
      }

      return count;
    };

    // Track the first status cumulative count of previous group for conversion calculation
    let previousGroupFirstStatusCumulativeCount = totalCandidates;

    Object.entries(processGroups).forEach(([groupKey, group], groupIndex) => {
      // Calculate group total (cumulative)
      const groupTotalCount = getGroupCumulativeCount(groupKey);

      // Get the first status cumulative count in this group (for comparing subsequent statuses)
      const groupFirstStatus = group.statuses[0];
      const groupFirstStatusCumulativeCount = groupFirstStatus
        ? getStatusCumulativeCount(groupFirstStatus.id, groupKey, 0)
        : 0;

      // Add group header with cumulative count
      funnelData.push({
        type: 'group',
        groupKey,
        groupLabel: group.label,
        count: groupTotalCount,
        previousCount: previousGroupFirstStatusCumulativeCount,
        conversionRate: previousGroupFirstStatusCumulativeCount > 0
          ? parseFloat(((groupTotalCount / previousGroupFirstStatusCumulativeCount) * 100).toFixed(1))
          : 0,
      });

      // Add statuses in this group
      group.statuses.forEach((status, statusIndex) => {
        // Get cumulative count for this status
        const statusCumulativeCount = getStatusCumulativeCount(status.id, groupKey, statusIndex);
        
        // Conversion rate calculation:
        // - First status in group: compares to previousGroupFirstStatusCumulativeCount
        // - Subsequent statuses in same group: compares to groupFirstStatusCumulativeCount
        const previousCount = statusIndex === 0 
          ? previousGroupFirstStatusCumulativeCount 
          : groupFirstStatusCumulativeCount;

        const conversionRate = previousCount > 0
          ? parseFloat(((statusCumulativeCount / previousCount) * 100).toFixed(1))
          : 0;

        funnelData.push({
          type: 'status',
          statusId: status.id,
          statusCode: status.code,
          statusName: status.name,
          statusColor: status.color,
          count: statusCumulativeCount,
          previousCount,
          conversionRate,
        });
      });

      // Update for next group: use first status cumulative count of current group
      previousGroupFirstStatusCumulativeCount = groupFirstStatusCumulativeCount;
    });

    return {
      // Summary cards
      totalCandidates,
      newCandidatesThisMonth,
      newCandidatesLastMonth,
      activeCampaigns: campaigns.filter((c) => c.isActive).length,
      totalCampaigns: campaigns.length,
      totalForms: await this.prisma.recruitmentForm.count({ where: { isActive: true } }),

      // Charts data
      candidatesByStatus,
      candidatesByCampaign: campaignStats,
      monthlyData,
      candidatesByBrand: candidatesByBrand.map((b) => ({
        brand: b.brand,
        count: b._count,
      })),
      candidatesByStore: storeStats,

      // Funnel data
      funnelData,
    };
  }

  // ============ Candidates ============
  async getCandidates(user: User, filters?: any) {
    const where: any = {};
    if (filters?.statusId) where.statusId = filters.statusId;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.formId) where.formId = filters.formId;
    if (filters?.storeId) where.storeId = filters.storeId;
    if (filters?.brand) where.brand = filters.brand;

    return this.prisma.candidate.findMany({
      where,
      include: {
        status: true,
        form: true,
        campaign: true,
        store: true,
        interviews: {
          include: {
            type: true,
            result: true,
            interviewer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCandidate(createDto: CreateCandidateDto, user: User) {
    if (createDto.formId) {
      const form = await this.prisma.recruitmentForm.findUnique({
        where: { id: createDto.formId },
      });
      if (!form) {
        throw new NotFoundException('Form not found');
      }
    }

    if (createDto.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: createDto.campaignId },
      });
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }
    }

    return this.prisma.candidate.create({
      data: createDto,
      include: {
        status: true,
        form: true,
        campaign: true,
        store: true,
      },
    });
  }

  async applyCandidate(applyDto: ApplyCandidateDto) {
    // Validate form exists and is active
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { id: applyDto.formId },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (!form.isActive) {
      throw new BadRequestException('Form is not active');
    }

    // Validate campaign if provided
    if (applyDto.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: applyDto.campaignId },
      });
      if (!campaign || !campaign.isActive) {
        throw new BadRequestException('Campaign not found or not active');
      }
      const now = new Date();
      if (campaign.endDate && campaign.endDate < now) {
        throw new BadRequestException('Campaign has ended');
      }
    }

    // Get default status (CV_FILTERING)
    const statusCategory = await this.prisma.typeCategory.findUnique({
      where: { code: 'CANDIDATE_STATUS' },
    });

    if (!statusCategory) {
      throw new BadRequestException('Candidate status category not found');
    }

    const defaultStatus = await this.prisma.type.findFirst({
      where: {
        categoryId: statusCategory.id,
        code: 'CV_FILTERING',
      },
    });

    if (!defaultStatus) {
      throw new BadRequestException('Default candidate status not found');
    }

    // Prepare permanent address
    let permanentCity = applyDto.permanentCity;
    let permanentDistrict = applyDto.permanentDistrict;
    let permanentWard = applyDto.permanentWard;
    let permanentStreet = applyDto.permanentStreet;

    if (applyDto.permanentSameAsCurrent) {
      permanentCity = applyDto.currentCity;
      permanentDistrict = applyDto.currentDistrict;
      permanentWard = applyDto.currentWard;
      permanentStreet = applyDto.currentStreet;
    }

    // Create candidate
    return this.prisma.candidate.create({
      data: {
        fullName: applyDto.fullName,
        email: applyDto.email,
        phone: applyDto.phone,
        gender: applyDto.gender,
        dateOfBirth: new Date(applyDto.dateOfBirth),
        cccd: applyDto.cccd,
        currentCity: applyDto.currentCity,
        currentDistrict: applyDto.currentDistrict,
        currentWard: applyDto.currentWard,
        currentStreet: applyDto.currentStreet,
        permanentSameAsCurrent: applyDto.permanentSameAsCurrent,
        permanentCity,
        permanentDistrict,
        permanentWard,
        permanentStreet,
        appliedPosition: applyDto.appliedPosition,
        appliedPositionOther: applyDto.appliedPositionOther,
        availableStartDate: new Date(applyDto.availableStartDate),
        preferredWorkShift: applyDto.preferredWorkShift,
        canWorkTet: applyDto.canWorkTet,
        referrer: applyDto.referrer,
        referrerName: applyDto.referrerName,
        preferredLocations: applyDto.preferredLocations,
        workExperience: applyDto.workExperience,
        formId: applyDto.formId,
        campaignId: applyDto.campaignId,
        statusId: defaultStatus.id,
        position: applyDto.appliedPosition === 'OTHER' ? applyDto.appliedPositionOther : applyDto.appliedPosition,
      },
      include: {
        status: true,
        form: true,
        campaign: true,
      },
    });
  }

  async getCandidate(id: string, user: User) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        status: true,
        form: true,
        campaign: true,
        store: true,
        interviews: {
          include: {
            type: true,
            result: true,
            interviewer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
        proposals: {
          include: {
            status: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  async deleteCandidate(id: string, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can delete candidates');
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        interviews: true,
        proposals: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Check if candidate has related records
    if (candidate.interviews.length > 0 || candidate.proposals.length > 0) {
      throw new BadRequestException(
        'Cannot delete candidate with existing interviews or proposals. Please remove related records first.',
      );
    }

    return this.prisma.candidate.delete({ where: { id } });
  }

  async updateCandidate(id: string, updateDto: UpdateCandidateDto, user: User) {
    const candidate = await this.prisma.candidate.findUnique({ 
      where: { id },
      include: { status: true },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Check permission for status update based on role
    if (updateDto.statusId) {
      // TODO: Implement role-based status validation using Type table
      // const allowedStatuses = this.getAllowedStatusesForRole(user.role);
      // if (!allowedStatuses.includes(updateDto.statusId)) {
      //   throw new ForbiddenException(
      //     `Your role does not allow changing status to this status`
      //   );
      // }

      // Check if status is changing to ONBOARDING_ACCEPTED
      const newStatus = await this.prisma.type.findUnique({
        where: { id: updateDto.statusId },
        include: { category: true },
      });

      const currentStatusCode = typeof candidate.status === 'object' 
        ? candidate.status.code 
        : candidate.status;

      // If status is changing to ONBOARDING_ACCEPTED, automatically convert to employee
      if (newStatus && newStatus.code === 'ONBOARDING_ACCEPTED' && currentStatusCode !== 'ONBOARDING_ACCEPTED') {
        await this.autoConvertCandidateToEmployee(candidate);
      }
    }

    return this.prisma.candidate.update({
      where: { id },
      data: updateDto,
      include: {
        status: true,
        form: true,
        campaign: true,
        store: true,
      },
    });
  }

  private async autoConvertCandidateToEmployee(candidate: any) {
    try {
      // Check if employee already exists for this candidate (by email or idCard)
      const existingEmployee = await this.prisma.employee.findFirst({
        where: {
          OR: [
            candidate.email ? { email: candidate.email } : { id: 'never-match' },
            candidate.cccd ? { idCard: candidate.cccd } : { id: 'never-match' },
          ].filter(condition => condition.id !== 'never-match'),
        },
      });

      if (existingEmployee) {
        // Employee already exists, skip conversion
        console.log(`Employee already exists for candidate ${candidate.id}`);
        return;
      }

      // Generate employee code
      const latestEmployee = await this.prisma.employee.findFirst({
        orderBy: { employeeCode: 'desc' },
        select: { employeeCode: true },
      });

      let employeeCode = 'EMP001';
      if (latestEmployee) {
        const match = latestEmployee.employeeCode.match(/EMP(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1], 10) + 1;
          employeeCode = `EMP${nextNumber.toString().padStart(3, '0')}`;
        }
      }

      // Get default status (WORKING)
      const workingStatus = await this.prisma.type.findFirst({
        where: {
          code: 'WORKING',
          category: { code: 'EMPLOYEE_STATUS' },
        },
      });

      // Build address from candidate's address fields
      let address = null;
      if (candidate.currentCity) {
        const addressParts = [
          candidate.currentStreet,
          candidate.currentWard,
          candidate.currentDistrict,
          candidate.currentCity,
        ].filter(Boolean);
        address = addressParts.join(', ') || null;
      }

      // Create employee with default values
      // Note: Education is required but not available in candidate, so we default to HIGH_SCHOOL
      // HR will need to update this later through the employee edit form
      const employee = await this.prisma.employee.create({
        data: {
          employeeCode,
          fullName: candidate.fullName,
          email: candidate.email || null,
          phone: candidate.phone,
          gender: candidate.gender || 'OTHER',
          dateOfBirth: candidate.dateOfBirth || null,
          address: address,
          idCard: candidate.cccd || null,
          education: 'HIGH_SCHOOL', // Default, should be updated by HR
          statusId: workingStatus?.id || null,
          departmentId: null, // Should be set by HR
          positionId: null, // Should be set by HR
          storeId: candidate.storeId || null,
          brand: candidate.brand || null,
          contractTypeId: null, // Should be set by HR
          startDate: null, // Should be set by HR
          endDate: null,
          salary: null, // Should be set by HR
          insuranceNumber: null, // Should be set by HR
        },
      });

      console.log(`Successfully converted candidate ${candidate.id} to employee ${employee.id} (${employee.employeeCode})`);
    } catch (error) {
      // Log error but don't fail the status update
      console.error(`Error auto-converting candidate ${candidate.id} to employee:`, error);
    }
  }

  private getAllowedStatusesForRole(role: UserRole): string[] {
    // This will be replaced with actual Type IDs from database
    // For now, return empty array - will be implemented after types are seeded
    switch (role) {
      case 'ADMIN':
      case 'HEAD_OF_DEPARTMENT':
        // Admin and Head of Department can change to any status
        return []; // Will be populated from Type table
      case 'MANAGER':
        // Manager can only change to SM/AM interview statuses
        return []; // Will be populated from Type table with specific codes
      default:
        return [];
    }
  }

  // ============ Interviews ============
  async getInterviews(user: User, filters?: any) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.interviewerId) where.interviewerId = filters.interviewerId;
    if (filters?.startDate && filters?.endDate) {
      where.scheduledAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters?.startDate) {
      where.scheduledAt = {
        gte: new Date(filters.startDate),
      };
    }

    return this.prisma.interview.findMany({
      where,
      include: {
        type: true,
        result: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async createInterview(createDto: CreateInterviewDto, user: User) {
    // Verify candidate exists
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: createDto.candidateId },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Verify interviewer exists
    const interviewer = await this.prisma.user.findUnique({
      where: { id: createDto.interviewerId },
    });
    if (!interviewer) {
      throw new NotFoundException('Interviewer not found');
    }

    return this.prisma.interview.create({
      data: {
        candidateId: createDto.candidateId,
        interviewerId: createDto.interviewerId,
        typeId: createDto.typeId,
        resultId: createDto.resultId,
        scheduledAt: new Date(createDto.scheduledAt),
        location: createDto.location,
        notes: createDto.notes,
      },
      include: {
        candidate: true,
        interviewer: true,
      },
    });
  }

  async updateInterview(id: string, updateDto: Partial<CreateInterviewDto>, user: User) {
    const interview = await this.prisma.interview.findUnique({ where: { id } });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const updateData: any = {};
    if (updateDto.scheduledAt) updateData.scheduledAt = new Date(updateDto.scheduledAt);
    if (updateDto.candidateId) updateData.candidateId = updateDto.candidateId;
    if (updateDto.interviewerId) updateData.interviewerId = updateDto.interviewerId;
    if (updateDto.typeId) updateData.typeId = updateDto.typeId;
    if (updateDto.resultId) updateData.resultId = updateDto.resultId;
    if (updateDto.location !== undefined) updateData.location = updateDto.location;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    return this.prisma.interview.update({
      where: { id },
      data: updateData,
      include: {
        candidate: true,
        interviewer: true,
      },
    });
  }

  // ============ Proposals ============
  async createProposal(createDto: CreateProposalDto, user: User) {
    if (createDto.storeId) {
      const store = await this.prisma.store.findUnique({ where: { id: createDto.storeId } });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
    }

    if (createDto.positionId) {
      const position = await this.prisma.position.findUnique({ where: { id: createDto.positionId } });
      if (!position) {
        throw new NotFoundException('Position not found');
      }
    }

    return this.prisma.recruitmentProposal.create({
      data: createDto,
      include: {
        store: true,
        position: true,
        _count: {
          select: { candidates: true },
        },
      },
    });
  }

  async getProposals(user: User, filters?: { statusId?: string; storeId?: string }) {
    const where: any = {};
    if (filters?.statusId) where.statusId = filters.statusId;
    if (filters?.storeId) where.storeId = filters.storeId;

    return this.prisma.recruitmentProposal.findMany({
      where,
      include: {
        status: true,
        store: true,
        position: true,
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        campaign: {
          include: {
            form: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProposal(id: string, user: User) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({
      where: { id },
      include: {
        status: true,
        store: true,
        position: true,
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        campaign: {
          include: {
            form: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        candidates: {
          include: {
            status: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  async updateProposal(id: string, updateDto: UpdateProposalDto, user: User) {
    // Only ADMIN, HR, or MANAGER can approve/reject
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Only ADMIN, HR, or MANAGER can approve/reject proposals');
    }

    const proposal = await this.prisma.recruitmentProposal.findUnique({ 
      where: { id },
      include: {
        store: true,
        position: true,
      },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    const updateData: any = {
      approverId: user.id,
    };

    if (updateDto.statusId) {
      updateData.statusId = updateDto.statusId;
      
      // Get status type to check if it's APPROVED or REJECTED
      const statusType = await this.prisma.type.findUnique({
        where: { id: updateDto.statusId },
      });
      
      if (statusType?.code === 'APPROVED') {
        // Check headcount before approving
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Find headcount for this proposal
        const headcountWhere: any = {
          year: currentYear,
        };

        if (proposal.storeId) {
          headcountWhere.storeId = proposal.storeId;
        }
        // Note: positionId is now in HeadcountPosition, so we filter via include

        const headcounts = await this.prisma.headcount.findMany({
          where: headcountWhere,
          include: {
            positions: {
              where: {
                positionId: proposal.positionId,
              },
              include: {
                position: true,
              },
            },
          },
        });

        // Check if we can approve based on headcount
        let canApprove = false;
        let headcountMessage = '';

        if (headcounts.length === 0) {
          // No headcount defined, cannot approve
          throw new BadRequestException('Không tìm thấy định biên cho đề xuất này. Vui lòng tạo định biên trước khi duyệt.');
        }

        for (const headcount of headcounts) {
          // Check monthly headcount if exists, otherwise check yearly
          const targetHeadcount = headcount.month ? headcount : headcounts.find(h => !h.month && h.year === currentYear);
          
          if (targetHeadcount && targetHeadcount.positions.length > 0) {
            const headcountPosition = targetHeadcount.positions[0];
            const availableSlots = headcountPosition.target - headcountPosition.current;
            if (availableSlots >= proposal.quantity) {
              canApprove = true;
              break;
            } else {
              headcountMessage = `Định biên chỉ còn ${availableSlots} vị trí, đề xuất yêu cầu ${proposal.quantity} vị trí.`;
            }
          }
        }

        if (!canApprove) {
          throw new BadRequestException(
            headcountMessage || 'Đề xuất vượt quá định biên cho phép. Không thể duyệt.'
          );
        }

        updateData.approvedAt = new Date();
      } else if (statusType?.code === 'REJECTED') {
        updateData.rejectedAt = new Date();
        if (updateDto.rejectionReason) {
          updateData.rejectionReason = updateDto.rejectionReason;
        }
      }
    }

    return this.prisma.recruitmentProposal.update({
      where: { id },
      data: updateData,
      include: {
        status: true,
        store: true,
        position: true,
        approver: true,
        campaign: true,
      },
    });
  }

  // ============ Headcount ============
  async createHeadcount(createDto: CreateHeadcountDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can create headcount');
    }

    // Generate code
    const year = createDto.year;
    const periodCode = createDto.period.substring(0, 1);
    const monthCode = createDto.month ? String(createDto.month).padStart(2, '0') : '00';
    const baseCode = `DB${year}${periodCode}${monthCode}`;
    
    let code = baseCode;
    let counter = 1;
    while (await this.prisma.headcount.findUnique({ where: { code } })) {
      code = `${baseCode}-${counter}`;
      counter++;
    }

    // Validate positions exist
    if (createDto.positionIds && createDto.positionIds.length > 0) {
      const positions = await this.prisma.position.findMany({
        where: { id: { in: createDto.positionIds } },
      });
      if (positions.length !== createDto.positionIds.length) {
        throw new BadRequestException('Một hoặc nhiều vị trí không tồn tại');
      }
    }

    const { positionIds, currents, targets, ...headcountData } = createDto;

    const headcount = await this.prisma.headcount.create({
      data: {
        ...headcountData,
        code,
        positions: {
          create: positionIds.map((positionId, index) => ({
            positionId,
            current: currents[index] || 0,
            target: targets[index] || 1,
          })),
        },
      },
      include: {
        department: true,
        positions: {
          include: {
            position: true,
          },
        },
        store: true,
      },
    });

    return headcount;
  }

  async getHeadcounts(user: User, filters?: { year?: number; departmentId?: string; storeId?: string }) {
    const where: any = {};
    if (filters?.year) where.year = filters.year;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.storeId) where.storeId = filters.storeId;

    return this.prisma.headcount.findMany({
      where,
      include: {
        department: true,
        positions: {
          include: {
            position: true,
          },
        },
        store: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async updateHeadcount(id: string, updateDto: Partial<CreateHeadcountDto>, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can update headcount');
    }

    const headcount = await this.prisma.headcount.findUnique({ where: { id } });
    if (!headcount) {
      throw new NotFoundException('Headcount not found');
    }

    const { positionIds, currents, targets, ...updateData } = updateDto as any;

    const updatePayload: any = { ...updateData };

    if (positionIds !== undefined) {
      // Delete existing positions
      await this.prisma.headcountPosition.deleteMany({
        where: { headcountId: id },
      });

      // Create new positions
      if (positionIds.length > 0) {
        updatePayload.positions = {
          create: positionIds.map((positionId: string, index: number) => ({
            positionId,
            current: currents && currents[index] !== undefined ? currents[index] : 0,
            target: targets && targets[index] !== undefined ? targets[index] : 1,
          })),
        };
      }
    }

    return this.prisma.headcount.update({
      where: { id },
      data: updatePayload,
      include: {
        department: true,
        positions: {
          include: {
            position: true,
          },
        },
        store: true,
      },
    });
  }

  async deleteHeadcount(id: string, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can delete headcount');
    }

    const headcount = await this.prisma.headcount.findUnique({ where: { id } });
    if (!headcount) {
      throw new NotFoundException('Headcount not found');
    }

    return this.prisma.headcount.delete({ where: { id } });
  }
}
