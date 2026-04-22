import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfMonth, subMonths, format } from 'date-fns';

const ALLOWED_SMAM_RESULTS = [
  'SM_AM_PASSED',
  'SM_AM_FAILED', 
  'SM_AM_NO_SHOW',
  'OM_PV_PASSED',
  'OM_PV_FAILED',
  'OM_PV_NO_SHOW',
];

const DEFAULT_FORM_FIELDS = [
  { name: 'fullName', label: 'Họ và tên', type: 'TEXT', required: true, order: 0, placeholder: 'Nhập họ và tên', width: 'full' },
  { name: 'phone', label: 'Số điện thoại', type: 'PHONE', required: true, order: 1, placeholder: 'Nhập số điện thoại', width: 'full' },
  { name: 'gender', label: 'Giới tính', type: 'RADIO', required: true, order: 2, placeholder: '', width: 'half', options: [{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }] },
  { name: 'dateOfBirth', label: 'Ngày sinh', type: 'DATE', required: true, order: 3, placeholder: 'dd/mm/yyyy', width: 'half' },
  { name: 'email', label: 'Email', type: 'EMAIL', required: true, order: 4, placeholder: 'Nhập email', width: 'full' },
  { name: 'cccd', label: 'CCCD (Căn cước công dân)', type: 'TEXT', required: true, order: 5, placeholder: 'Nhập số CCCD', width: 'full' },
  { name: 'currentStreet', label: 'Tên đường', type: 'TEXT', required: true, order: 6, placeholder: 'Nhập địa chỉ', width: 'full' },
  { name: 'currentWard', label: 'Phường/Xã', type: 'SELECT', required: true, order: 7, placeholder: 'Chọn Phường/Xã', width: 'half' },
  { name: 'currentCity', label: 'Tỉnh/Thành', type: 'SELECT', required: true, order: 8, placeholder: 'Chọn Tỉnh/Thành', width: 'half' },
  { name: 'appliedPosition', label: 'Vị trí ứng tuyển', type: 'SELECT', required: true, order: 9, placeholder: 'Chọn vị trí', width: 'full' },
  { name: 'cv', label: 'Đính kèm CV', type: 'FILE', required: false, order: 10, placeholder: 'Tải lên CV (pdf, doc, docx)', width: 'full', helpText: 'Chấp nhận file .pdf, .doc, .docx dung lượng tối đa 5MB' },
];

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // Forms
  async getForms() {
    const forms = await this.prisma.recruitmentForm.findMany({
      include: { fields: true, positions: true },
      orderBy: { createdAt: 'desc' },
    });
    return forms.map(form => ({
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        options: field.options ? typeof field.options === 'string' ? JSON.parse(field.options) : field.options : null,
      })),
    }));
  }

  async getFormByLink(link: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { link },
      include: { fields: true, positions: true },
    });
    if (!form) throw new NotFoundException('Form not found');
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        options: field.options ? typeof field.options === 'string' ? JSON.parse(field.options) : field.options : null,
      })),
    };
  }

  async getForm(id: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { id },
      include: { fields: true, positions: true, campaigns: true, candidates: true },
    });
    if (!form) throw new NotFoundException('Form not found');
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        options: field.options ? typeof field.options === 'string' ? JSON.parse(field.options) : field.options : null,
      })),
    };
  }

  async createForm(data: any) {
    const formData: any = {
      title: data.title,
      description: data.description,
      brand: data.brand || 'KFC',
      source: data.source,
      link: data.link || `/apply/${Date.now()}`,
      formTitle: data.formTitle,
      formContent: data.formContent,
      bannerUrl: data.bannerUrl,
      isActive: data.isActive ?? true,
    };
    if (data.positionIds && data.positionIds.length > 0) {
      formData.positions = { connect: data.positionIds.map((id: string) => ({ id })) };
    }
    const form = await this.prisma.recruitmentForm.create({ data: formData });

    const fieldsToCreate = data.fields && Array.isArray(data.fields) && data.fields.length > 0
      ? data.fields
      : DEFAULT_FORM_FIELDS;

    if (fieldsToCreate.length > 0) {
      await this.prisma.formField.createMany({
        data: fieldsToCreate.map((f: any, index: number) => ({
          formId: form.id,
          name: f.name,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          required: f.required ?? false,
          order: f.order ?? index,
          options: f.options ? JSON.stringify(f.options) : null,
          width: f.width,
          helpText: f.helpText,
          isActive: f.isActive ?? true,
        })),
      });
    }

    return this.prisma.recruitmentForm.findUnique({ where: { id: form.id }, include: { fields: true, positions: true } });
  }

  async updateForm(id: string, data: any) {
    const updateData: any = {};
    const allowedFields = ['title', 'description', 'brand', 'source', 'link', 'formTitle', 'formContent', 'bannerUrl', 'isActive'];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    if (data.positionIds) {
      if (data.positionIds.length > 0) {
        updateData.positions = { set: data.positionIds.map((id: string) => ({ id })) };
      } else {
        updateData.positions = { set: [] };
      }
    }

    if (data.fields && Array.isArray(data.fields)) {
      await this.prisma.formField.deleteMany({ where: { formId: id } });
      if (data.fields.length > 0) {
        await this.prisma.formField.createMany({
          data: data.fields.map((f: any, index: number) => ({
            formId: id,
            name: f.name,
            label: f.label,
            type: f.type,
            placeholder: f.placeholder,
            required: f.required ?? false,
            order: f.order ?? index,
            options: f.options ? JSON.stringify(f.options) : null,
            width: f.width,
            helpText: f.helpText,
            isActive: f.isActive ?? true,
          })),
        });
      }
    }

    return this.prisma.recruitmentForm.update({ where: { id }, data: updateData });
  }

  async deleteForm(id: string) {
    return this.prisma.recruitmentForm.delete({ where: { id } });
  }

  // Campaigns
  async getCampaigns(user?: any) {
    const where: any = {};
    
    // Filter by user access for SM/AM
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (storeIds.length > 0) {
        where.storeId = { in: storeIds };
      } else {
        return [];
      }
    }

    return this.prisma.campaign.findMany({
      where,
      include: { 
        form: true, 
        candidates: true,
        store: { select: { id: true, name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { 
        form: true, 
        candidates: true, 
        store: true
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    
    // Check access
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!campaign.storeId || !storeIds.includes(campaign.storeId)) {
        throw new ForbiddenException('Bạn không có quyền xem chiến dịch này');
      }
    }
    return campaign;
  }

  async createCampaign(data: any, user?: any) {
    // Auto-assign store from proposal
    if (data.proposalId) {
      const proposal = await this.prisma.recruitmentProposal.findUnique({
        where: { id: data.proposalId },
        include: { store: true, position: true }
      });
      
      if (proposal) {
        data.storeId = proposal.storeId;
        
        // Check headcount constraint
        if (proposal.storeId && proposal.positionId) {
          const headcount = await this.prisma.headcount.findFirst({
            where: { storeId: proposal.storeId },
            include: { 
              positions: { 
                where: { positionId: proposal.positionId },
                include: { position: true }
              } 
            },
            orderBy: { createdAt: 'desc' }
          });
          
          if (headcount && headcount.positions.length > 0) {
            const hp = headcount.positions[0];
            const available = hp.target - hp.current;
            
            if (proposal.quantity > available) {
              throw new Error(
                `Không thể tạo chiến dịch. Số lượng yêu cầu (${proposal.quantity}) vượt quá định biên còn lại (${available}) của cửa hàng ${proposal.store?.name} cho vị trí ${hp.position.name}`
              );
            }
          }
        }
      }
    }
    
    // Check access for SM/AM
    if (user && user.role !== 'ADMIN' && data.storeId) {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!storeIds.includes(data.storeId)) {
        throw new ForbiddenException('Bạn không có quyền tạo chiến dịch cho cửa hàng này');
      }
    }
    
    return this.prisma.campaign.create({ data });
  }

  async updateCampaign(id: string, data: any, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại');

    // Check access
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!campaign.storeId || !storeIds.includes(campaign.storeId)) {
        throw new ForbiddenException('Bạn không có quyền cập nhật chiến dịch này');
      }
    }
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async deleteCampaign(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }

  // Candidates
  async getCandidates(filters?: any, user?: any) {
    const where: any = {};
    if (filters?.status) {
      where.status = { code: filters.status };
    }
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.storeId) where.storeId = filters.storeId;

    // Apply store scoping for SM/AM
    let storeIds: string[] = [];
    if (user) {
      storeIds = await this.getAccessibleStoreIds(user);
      if (storeIds.length > 0 && user.role !== 'ADMIN') {
        where.storeId = { in: storeIds };
      }
    }

    return this.prisma.candidate.findMany({
      where,
      include: { 
        campaign: true, 
        store: true, 
        form: true,
        source: true,
        status: true,
        pic: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getAccessibleStoreIds(user: any): Promise<string[]> {
    if (user.role === 'ADMIN') {
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

  async getCandidate(id: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: { 
        campaign: true, 
        store: true, 
        interviews: { include: { interviewer: { select: { id: true, fullName: true } } } },
        status: true,
        source: true,
        proposals: true,
        pic: {
          select: { id: true, fullName: true, email: true }
        }
      },
    });

    // Check access permission
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!candidate.storeId || !storeIds.includes(candidate.storeId)) {
        throw new ForbiddenException('Bạn không có quyền xem ứng viên này');
      }
    }

    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async createCandidate(data: any, user?: any) {
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
    
    const { status: statusName, sourceCode, ...rest } = data;
    return this.prisma.candidate.create({
      data: {
        ...rest,
        sourceId,
        statusId: status?.id
      }
    });
  }

  async updateCandidate(id: string, data: any, user?: any) {
    // Check access
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!candidate.storeId || !storeIds.includes(candidate.storeId)) {
        throw new ForbiddenException('Bạn không có quyền cập nhật ứng viên này');
      }

      // Check if trying to change to restricted status
      if (data.status && !ALLOWED_SMAM_RESULTS.includes(data.status)) {
        throw new ForbiddenException('Bạn không có quyền cập nhật trạng thái này. Chỉ được cập: SM/AM PV đạt, SM/AM PV loại, OM PV đạt, OM PV loại, Không đến PV');
      }
    }

    const updateData: any = { ...data };
    
    if (data.status) {
      const status = await this.prisma.candidateStatus.findUnique({
        where: { code: data.status }
      });
      if (status) {
        updateData.statusId = status.id;
        delete updateData.status;
      }
    }
    
    return this.prisma.candidate.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCandidate(id: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!candidate.storeId || !storeIds.includes(candidate.storeId)) {
        throw new ForbiddenException('Bạn không có quyền xóa ứng viên này');
      }
    }
    return this.prisma.candidate.delete({ where: { id } });
  }

  async transferCampaign(candidateId: string, campaignId: string, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({ 
      where: { id: campaignId },
      include: { store: true, department: true }
    });
    if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại');
    
    // Check access for SM/AM
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!campaign.storeId || !storeIds.includes(campaign.storeId)) {
        throw new ForbiddenException('Bạn không có quyền chuyển ứng viên này');
      }
    }
    
    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: { 
        campaignId,
        storeId: campaign.storeId,
        departmentId: campaign.departmentId
      }
    });
  }

  // Interviews
  async getInterviews(filters?: any) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.interviewerId) where.interviewerId = filters.interviewerId;

    return this.prisma.interview.findMany({
      where,
      include: { candidate: true, interviewer: true },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async createInterview(data: any) {
    return this.prisma.interview.create({ data });
  }

  async updateInterview(id: string, data: any) {
    return this.prisma.interview.update({ where: { id }, data });
  }

  // Proposals
  async getProposals(user?: any) {
    const where: any = {};
    
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      where.storeId = { in: storeIds };
    }

    return this.prisma.recruitmentProposal.findMany({
      where,
      include: { store: true, position: true, candidates: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProposal(id: string, user?: any) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({
      where: { id },
      include: { store: true, position: true, candidates: true },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');

    // Check access
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!proposal.storeId || !storeIds.includes(proposal.storeId)) {
        throw new ForbiddenException('Bạn không có quyền xem đề xuất này');
      }
    }
    return proposal;
  }

  async createProposal(data: any, user?: any) {
    // Auto-assign store from user's managed store for SM/AM
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (storeIds.length === 1) {
        data.storeId = storeIds[0];
      }
    }
    return this.prisma.recruitmentProposal.create({ data });
  }

  async updateProposal(id: string, data: any, user?: any) {
    // Check access
    const proposal = await this.prisma.recruitmentProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!proposal.storeId || !storeIds.includes(proposal.storeId)) {
        throw new ForbiddenException('Bạn không có quyền cập nhật đề xuất này');
      }
    }
    return this.prisma.recruitmentProposal.update({ where: { id }, data });
  }

  // Headcounts
  async getHeadcounts() {
    return this.prisma.headcount.findMany({
      include: { store: true, positions: { include: { position: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHeadcount(data: any) {
    return this.prisma.headcount.create({ data });
  }

  // Dashboard stats
  async getDashboard() {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    const totalCandidates = await this.prisma.candidate.count();
    const totalCampaigns = await this.prisma.campaign.count();
    const totalProposals = await this.prisma.recruitmentProposal.count();
    const totalForms = await this.prisma.recruitmentForm.count();
    const activeCampaigns = await this.prisma.campaign.count({ where: { isActive: true } });

    const newCandidatesThisMonth = await this.prisma.candidate.count({
      where: { createdAt: { gte: startOfCurrentMonth } },
    });
    const newCandidatesLastMonth = await this.prisma.candidate.count({
      where: { 
        createdAt: { 
          gte: startOfLastMonth,
          lt: startOfCurrentMonth
        } 
      },
    });

    // Candidates by Status - Fetch everything from database
    const allStatuses = await this.prisma.candidateStatus.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { candidates: true } }
      }
    });

    const candidatesByStatus = allStatuses.map((s) => ({
      statusId: s.id,
      statusCode: s.code,
      statusName: s.name,
      statusColor: s.color,
      count: s._count.candidates,
    }));

    // Candidates by Campaign
    const campaignCounts = await this.prisma.campaign.findMany({
      include: {
        form: true,
        _count: { select: { candidates: true } },
      },
      take: 10,
      orderBy: { candidates: { _count: 'desc' } },
    });

    const candidatesByCampaign = campaignCounts.map((c) => ({
      campaignId: c.id,
      campaignName: c.name,
      formName: c.form?.title || '',
      count: c._count.candidates,
    }));

    // Candidates by Store
    const storeCounts = await this.prisma.store.findMany({
      include: { 
        _count: { select: { candidates: true } } 
      },
      take: 10,
      orderBy: { candidates: { _count: 'desc' } },
    });

    const candidatesByStore = storeCounts.map((s) => ({
      storeId: s.id,
      storeName: s.name,
      count: s._count.candidates,
    }));

    // Monthly Trend (Last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = startOfMonth(subMonths(monthDate, -1));
      
      const count = await this.prisma.candidate.count({
        where: { createdAt: { gte: start, lt: end } },
      });

      monthlyData.push({
        month: format(monthDate, 'MM/yyyy'),
        count,
      });
    }

    // Funnel Data (Grouped by application, interview, onboarding)
    const funnelData = await this.getFunnelData(candidatesByStatus);

    return {
      totalCandidates,
      newCandidatesThisMonth,
      newCandidatesLastMonth,
      activeCampaigns,
      totalCampaigns,
      totalForms,
      totalProposals,
      candidatesByStatus,
      candidatesByCampaign,
      candidatesByStore,
      monthlyData,
      funnelData,
    };
  }

  private async getFunnelData(statusData: any[]) {
    // Fetch all active statuses to determine groups and order
    const allActiveStatuses = await this.prisma.candidateStatus.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const groupLabels: Record<string, string> = {
      application: 'Ứng tuyển',
      interview: 'Phỏng vấn',
      offer: 'Thư mời',
      onboarding: 'Trúng tuyển',
    };

    // Get unique groups in their first-appearance order
    const uniqueGroups = Array.from(new Set(allActiveStatuses.map(s => s.group))).filter(Boolean) as string[];

    const result: any[] = [];
    for (const groupKey of uniqueGroups) {
      result.push({ 
        type: 'group', 
        groupKey: groupKey, 
        groupLabel: groupLabels[groupKey] || groupKey 
      });

      const groupStatuses = allActiveStatuses.filter(s => s.group === groupKey);

      groupStatuses.forEach(gs => {
        const sData = statusData.find(s => s.statusCode === gs.code);
        result.push({
          type: 'status',
          statusId: gs.id,
          statusCode: gs.code,
          statusName: gs.name,
          statusColor: gs.color || '#6B7280',
          count: sData?.count || 0,
        });
      });
    }
    return result;
  }

  // Sources
  async getSources() {
    return this.prisma.source.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getSource(id: string) {
    const source = await this.prisma.source.findUnique({
      where: { id },
      include: { candidates: true },
    });
    if (!source) throw new NotFoundException('Source not found');
    return source;
  }

  async createSource(data: any) {
    return this.prisma.source.create({ data });
  }

  async updateSource(id: string, data: any) {
    return this.prisma.source.update({ where: { id }, data });
  }

  async deleteSource(id: string) {
    return this.prisma.source.delete({ where: { id } });
  }

  async getSourceByCode(code: string) {
    return this.prisma.source.findUnique({ where: { code } });
  }

  // Generate public form link with source tracking
  generateFormLink(baseUrl: string, sourceCode: string) {
    const url = new URL(baseUrl);
    url.searchParams.set('source', sourceCode);
    return url.toString();
  }

  private getManualStatusName(code: string): string {
    const names: Record<string, string> = {
      CV_FILTERING: 'Lọc CV',
      CV_PASSED: 'Ứng viên đạt',
      CV_FAILED: 'Ứng viên loại',
      BLACKLIST: 'Blacklist',
      CANNOT_CONTACT: 'Không liên hệ được',
      AREA_NOT_RECRUITING: 'Khu vực chưa tuyển dụng',
      
      WAITING_INTERVIEW: 'Chờ phỏng vấn',
      HR_INTERVIEW_PASSED: 'HR sơ vấn đạt',
      HR_INTERVIEW_FAILED: 'HR sơ vấn loại',
      SM_AM_INTERVIEW_PASSED: 'SM/AM PV Đạt',
      SM_AM_INTERVIEW_FAILED: 'SM/AM PV Loại',
      SM_AM_NO_SHOW: 'SM/AM PV Không đến PV',
      OM_PV_INTERVIEW_PASSED: 'OM PV Đạt',
      OM_PV_INTERVIEW_FAILED: 'OM PV Loại',
      OM_PV_NO_SHOW: 'OM PV Không đến PV',

      OFFER_SENT: 'Đã gửi offer letter',
      OFFER_ACCEPTED: 'Đồng ý offer letter',
      OFFER_REJECTED: 'Từ chối offer letter',

      WAITING_ONBOARDING: 'Chờ nhận việc',
      ONBOARDING_ACCEPTED: 'Đồng ý nhận việc',
      ONBOARDING_REJECTED: 'Từ chối nhận việc',
    };
    return names[code] || code;
  }
}
