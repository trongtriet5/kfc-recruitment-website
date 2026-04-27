import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  // ============================================================================
  // FORMS DOMAIN - Recruitment form CRUD operations
  // ============================================================================

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

    return form;
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

  // ============================================================================
  // CAMPAIGNS DOMAIN - Campaign CRUD and statistics
  // ============================================================================

  async getCampaignStatistics(campaignId?: string) {
    const where: any = campaignId ? { id: campaignId } : {};

    const campaigns = await this.prisma.campaign.findMany({
      where,
      select: {
        id: true,
        _count: { select: { candidates: true } },
      },
    });

    const total = campaigns.reduce((sum, c) => sum + c._count.candidates, 0);

    let byStatus: Record<string, number> = {};

    if (campaignId) {
      const candidates = await this.prisma.candidate.findMany({
        where: { campaignId },
        include: { status: { select: { code: true } } },
      });
      byStatus = candidates.reduce((acc, c) => {
        const code = c.status?.code || 'unknown';
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }

    return { total, byStatus };
  }

  // Campaigns
  async getCampaigns(user?: any) {
    const where: any = {};

    // SOFT DELETE: Exclude deleted records by default
    where.deletedAt = null;

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
        store: { select: { id: true, name: true, code: true } },
        _count: { select: { candidates: true } },
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

  async getCampaignByLink(link: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { link },
      include: { 
        form: true,
        store: true
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(data: any, user?: any) {
    let proposalData = null;

    // CONSTRAINT: Proposal must be APPROVED before Campaign creation
    if (data.proposalId) {
      const proposal = await this.prisma.recruitmentProposal.findUnique({
        where: { id: data.proposalId },
        include: { store: true, position: true }
      });

      if (!proposal) {
        throw new NotFoundException('Đề xuất không tồn tại');
      }

      // Check if proposal is APPROVED
      if (proposal.status !== 'APPROVED') {
        throw new ForbiddenException(
          `Chỉ có thể tạo chiến dịch từ đề xuất đã được duyệt. Trạng thái hiện tại: ${proposal.status}`
        );
      }

      // Check if campaign already exists for this proposal
      if (proposal.campaignId) {
        throw new ForbiddenException('Đề xuất này đã có chiến dịch được tạo');
      }

      if (proposal) {
        proposalData = proposal;
        data.storeId = proposal.storeId;
        data.positionId = proposal.positionId;
        data.isUntilFilled = proposal.isUntilFilled;
        
        // Xử lý ngày tháng theo loại tuyển dụng
        if (proposal.isUntilFilled) {
          // Tuyển đến khi đủ: ngày bắt đầu là hôm nay, không có ngày kết thúc
          data.startDate = new Date();
          data.endDate = null;
        } else {
          // Theo kế hoạch: lấy ngày từ proposal
          data.startDate = proposal.startDate;
          data.endDate = proposal.endDate;
        }
        
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
    
    // Convert empty strings to null for date fields
    if (data.startDate === '') data.startDate = null;
    if (data.endDate === '') data.endDate = null;
    
    // Auto-assign formId based on proposal's position
    let formId = data.formId;
    if (!formId && proposalData?.positionId) {
      const form = await this.prisma.recruitmentForm.findFirst({
        where: { 
          positions: { some: { id: proposalData.positionId } },
          isActive: true 
        }
      });
      formId = form?.id;
    }
    // Get any active form as fallback
    if (!formId) {
      const defaultForm = await this.prisma.recruitmentForm.findFirst({ where: { isActive: true } });
      formId = defaultForm?.id;
    }
    if (!formId) {
      throw new BadRequestException('Không có form tuyển dụng nào đang hoạt động. Vui lòng liên hệ admin để tạo form.');
    }

    // Generate unique link for campaign
    const link = `kfc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const { recruiterId, quantity, ...campaignData } = {
      ...data,
      formId,
      link,
      targetQty: data.quantity || 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    };
    
    return this.prisma.campaign.create({ data: campaignData });
  }

  async updateCampaign(id: string, data: any, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại');

    // Convert empty strings to null for date fields
    if (data.startDate === '') data.startDate = null;
    if (data.endDate === '') data.endDate = null;

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
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { candidates: true }
    });
    if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại');
    if (campaign.candidates.length > 0) {
      throw new Error('Không thể xóa chiến dịch đã có ứng viên. Vui lòng xóa hết ứng viên trước.');
    }

    // SOFT DELETE: Set deletedAt instead of hard delete
    return this.prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  // ============================================================================
  // CANDIDATES DOMAIN - Candidate CRUD and queries
  // ============================================================================

  // Candidates
  async getCandidates(filters?: any, user?: any) {
    const where: any = {};

    // SOFT DELETE: Exclude deleted records by default
    where.deletedAt = null;

    if (filters?.status) {
      where.status = { code: filters.status };
    }
    if (filters?.statusId) {
      where.statusId = filters.statusId;
    }
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.taId) where.picId = filters.taId;
    
    if (filters?.storeId) {
      if (filters.storeId.startsWith('CITY:')) {
        const city = filters.storeId.replace('CITY:', '');
        const storeIdsInCity = await this.getStoreIdsByCity(city);
        where.OR = [
          { storeId: { in: storeIdsInCity } },
          { preferredLocations: { hasSome: storeIdsInCity } }
        ];
      } else {
        where.storeId = filters.storeId;
      }
    }

    // Apply store scoping for SM/AM and PIC filtering
    let storeIds: string[] = [];
    if (user) {
      storeIds = await this.getAccessibleStoreIds(user);

      if (user.role === 'USER') {
        // USER (SM): Can see candidates assigned as PIC OR in their managed store
        where.OR = [
          { picId: user.id },  // Candidates where user is PIC
          { storeId: { in: storeIds } }  // Candidates in their managed store
        ];
      } else if (user.role !== 'ADMIN' && storeIds.length > 0) {
        // Other roles: filter by accessible stores
        where.storeId = { in: storeIds };
      }
    }

    // Pagination
    const page = filters?.page ? parseInt(filters.page, 10) : 1;
    const limit = filters?.limit ? parseInt(filters.limit, 10) : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
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
        skip,
        take: limit,
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStoreIdsByCity(city: string): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      where: { city, isActive: true },
      select: { id: true }
    });
    return stores.map(s => s.id);
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
        proposal: true,
        pic: {
          select: { id: true, fullName: true, email: true }
        },
        form: true,
        auditLogs: {
          include: { actor: true, campaign: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      },
    });

    if (!candidate) throw new NotFoundException('Candidate not found');

    // Check access permission
    if (user && user.role !== 'ADMIN' && user.role !== 'RECRUITER') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (candidate.storeId && !storeIds.includes(candidate.storeId)) {
        throw new ForbiddenException('Bạn không có quyền xem ứng viên này');
      }
    }

    // Resolve preferred locations names
    let preferredStoreNames: string[] = [];
    if (candidate.preferredLocations && candidate.preferredLocations.length > 0) {
      const stores = await this.prisma.store.findMany({
        where: { id: { in: candidate.preferredLocations } },
        select: { name: true, code: true }
      });
      preferredStoreNames = stores.map(s => `${s.name}${s.code ? ` (${s.code})` : ''}`);
    }

    return {
      ...candidate,
      preferredStoreNames
    };
  }

  async getTAs() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'RECRUITER', 'HEAD_OF_DEPARTMENT', 'MANAGER'] },
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      },
      orderBy: { fullName: 'asc' }
    });
  }

  async assignPIC(candidateId: string, picId: string) {
    return this.prisma.candidate.update({
      where: { id: candidateId },
      data: { picId }
    });
  }

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

    // CONSTRAINT: Prevent duplicate phone per store
    if (data.phone && data.storeId) {
      const existingCandidate = await this.prisma.candidate.findFirst({
        where: {
          phone: data.phone,
          storeId: data.storeId,
        },
      });
      if (existingCandidate) {
        throw new ForbiddenException(
          'Số điện thoại đã tồn tại trong cửa hàng này'
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
    const oldStatusId = candidate.statusId;
    
    if (data.status) {
      const status = await this.prisma.candidateStatus.findUnique({
        where: { code: data.status }
      });
      if (status) {
        updateData.statusId = status.id;
        delete updateData.status;
      }
    }
    
    const updatedCandidate = await this.prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    // Create audit logs for status changes
    if (data.status) {
      const newStatus = await this.prisma.candidateStatus.findUnique({
        where: { id: updatedCandidate.statusId }
      });
      const oldStatus = await this.prisma.candidateStatus.findUnique({
        where: { id: oldStatusId }
      });
      if (newStatus) {
        await this.prisma.candidateAuditLog.create({
          data: {
            candidateId: id,
            actorId: user?.id,
            action: 'STATUS_CHANGE',
            fromValue: oldStatus?.name || null,
            toValue: newStatus.name,
            notes: data.notes || null,
          }
        });
      }
    }

    // Create audit logs for PIC changes
    if (data.picId && data.picId !== candidate.picId) {
      const pic = await this.prisma.user.findUnique({
        where: { id: data.picId },
        select: { fullName: true }
      });
      await this.prisma.candidateAuditLog.create({
        data: {
          candidateId: id,
          actorId: user?.id,
          action: 'PIC_ASSIGN',
          toValue: pic?.fullName || null,
          notes: data.notes || null,
        }
      });
    }

    return updatedCandidate;
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

    // SOFT DELETE: Set deletedAt instead of hard delete
    return this.prisma.candidate.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async transferCampaign(candidateId: string, campaignId: string, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { store: true, proposal: true }
    });
    if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại');

    // CONSTRAINT: Candidate can only be assigned to ACTIVE campaign
    if (campaign.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Chỉ có thể chuyển ứng viên vào chiến dịch đang hoạt động. Trạng thái hiện tại: ${campaign.status}`
      );
    }

    // Check access for SM/AM
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!campaign.storeId || !storeIds.includes(campaign.storeId)) {
        throw new ForbiddenException('Bạn không có quyền chuyển ứng viên này');
      }
    }
    
    const updatedCandidate = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { 
        campaignId,
        proposalId: campaign.proposalId || undefined,
        storeId: campaign.storeId,
      }
    });

    // Create audit log for campaign transfer
    await this.prisma.candidateAuditLog.create({
      data: {
        candidateId,
        actorId: user?.id,
        action: 'CAMPAIGN_TRANSFER',
        campaignId,
      }
    });

    return updatedCandidate;
  }

  // ============================================================================
  // INTERVIEWS DOMAIN - Interview scheduling and management
  // ============================================================================

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
    return this.prisma.interview.create({
      data: {
        candidateId: data.candidateId,
        interviewerId: data.interviewerId,
        scheduledAt: new Date(data.scheduledAt),
        location: data.location || undefined,
        notes: data.notes,
        type: data.type || undefined,
        result: data.result || undefined,
        position: data.position || undefined,
      }
    });
  }

  async updateInterview(id: string, data: any) {
    return this.prisma.interview.update({ where: { id }, data });
  }

  // ============================================================================
  // PROPOSALS DOMAIN - Recruitment proposal management
  // ============================================================================

  // Proposals
  async getProposals(user?: any) {
    // Debug: Return all proposals without filtering
    return this.prisma.recruitmentProposal.findMany({
      include: { store: true, position: true, candidates: true, workflowHistory: { include: { actor: true }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProposal(id: string, user?: any) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({
      where: { id },
      include: { store: true, position: true, candidates: true, workflowHistory: { include: { actor: true }, orderBy: { createdAt: 'asc' } } },
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

    // CONSTRAINT: Prevent duplicate active proposals for same store/position
    if (data.storeId && data.positionId) {
      const existingProposal = await this.prisma.recruitmentProposal.findFirst({
        where: {
          storeId: data.storeId,
          positionId: data.positionId,
          status: { in: ['DRAFT', 'SUBMITTED', 'AM_REVIEWED', 'HR_ACCEPTED', 'APPROVED'] },
        },
      });
      if (existingProposal) {
        throw new ForbiddenException(
          'Đã có đề xuất đang chờ duyệt hoặc đã được duyệt cho cửa hàng và vị trí này'
        );
      }
    }

    // CONSTRAINT: quantity must be > 0
    if (data.quantity !== undefined && data.quantity < 1) {
      throw new BadRequestException('Số lượng yêu cầu phải lớn hơn 0');
    }

    // Convert empty strings to null for date fields
    if (data.startDate === '') data.startDate = null;
    if (data.endDate === '') data.endDate = null;

    return this.prisma.recruitmentProposal.create({ data });
  }

  async updateProposal(id: string, data: any, user?: any) {
    // Check access
    const proposal = await this.prisma.recruitmentProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');

    // Convert empty strings to null for date fields
    if (data.startDate === '') data.startDate = null;
    if (data.endDate === '') data.endDate = null;

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!proposal.storeId || !storeIds.includes(proposal.storeId)) {
        throw new ForbiddenException('Bạn không có quyền cập nhật đề xuất này');
      }
    }
    return this.prisma.recruitmentProposal.update({ where: { id }, data });
  }

  async deleteProposal(id: string, user?: any) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({ 
      where: { id },
      include: { candidates: true }
    });
    if (!proposal) throw new NotFoundException('Đề xuất không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!proposal.storeId || !storeIds.includes(proposal.storeId)) {
        throw new ForbiddenException('Bạn không có quyền xóa đề xuất này');
      }
    }

    if (proposal.candidates.length > 0) {
      throw new Error('Không thể xóa đề xuất đã có ứng viên. Vui lòng xóa hết ứng viên trước.');
    }

    await this.prisma.recruitmentProposal.delete({ where: { id } });
    return { success: true };
  }

  // ============================================================================
  // HEADCOUNTS DOMAIN - Headcount planning and tracking
  // ============================================================================

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

  // ============================================================================
  // DASHBOARD DOMAIN - Analytics and reporting
  // ============================================================================

  // Dashboard stats
  async getDashboard(filters?: {
    campaignId?: string
    storeId?: string
    taId?: string
    statusId?: string
    dateFrom?: Date
    dateTo?: Date
  }) {
    const { campaignId, storeId, taId, statusId, dateFrom, dateTo } = filters || {}
    
    // Build where clause
    const candidateWhere: any = {}
    if (campaignId) candidateWhere.campaignId = campaignId
    if (storeId) candidateWhere.storeId = storeId
    if (taId) candidateWhere.picId = taId
    if (statusId) candidateWhere.statusId = statusId
    if (dateFrom || dateTo) {
      candidateWhere.createdAt = {}
      if (dateFrom) candidateWhere.createdAt.gte = dateFrom
      if (dateTo) candidateWhere.createdAt.lte = dateTo
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    const totalCandidates = await this.prisma.candidate.count({ where: candidateWhere });
    const totalCampaigns = await this.prisma.campaign.count();
    const totalProposals = await this.prisma.recruitmentProposal.count();
    const totalForms = await this.prisma.recruitmentForm.count();
    const activeCampaigns = await this.prisma.campaign.count({ where: { isActive: true } });

    const dateFilter = dateFrom || dateTo ? { createdAt: { ...candidateWhere.createdAt } } : {}
    const newCandidatesThisMonth = await this.prisma.candidate.count({
      where: { 
        ...dateFilter, 
        ...(campaignId ? { campaignId } : {}),
        createdAt: { gte: startOfCurrentMonth, ...(dateFrom ? { gte: dateFrom } : {}) } 
      },
    });
    const newCandidatesLastMonth = await this.prisma.candidate.count({ 
      where: { 
        createdAt: { 
          gte: startOfLastMonth,
          lt: startOfCurrentMonth,
          ...(dateFrom ? { gte: dateFrom } : {}),
        } 
      },
    });

    // Candidates by Status - Fetch everything from database
    const allStatuses = await this.prisma.candidateStatus.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        order: true,
        color: true,
        group: true,
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

    // Apply filters to candidatesByStatus
    const filteredCandidatesByStatus = await this.prisma.candidateStatus.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: { 
          select: { 
            candidates: { where: candidateWhere } 
          } 
        } 
      }
    });
    
    const filteredCountsByStatus = filteredCandidatesByStatus.reduce((acc, s) => {
      acc[s.id] = s._count.candidates
      return acc
    }, {} as Record<string, number>)

    // Candidates by Campaign
    const campaignCounts = await this.prisma.campaign.findMany({
      include: {
        form: true,
        _count: { 
          select: { 
            candidates: Object.keys(candidateWhere).length > 0 ? { where: candidateWhere } : true 
          } 
        },
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
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { candidates: true } },
      },
      take: 10,
      orderBy: { candidates: { _count: 'desc' } },
    });

    const candidatesByStore = storeCounts.map((s) => ({
      storeId: s.id,
      storeName: s.name,
      storeCode: s.code,
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

    // TA Performance (candidates processed by each TA/user with PIC assigned)
    // Admin không tính vì là quản trị hệ thống
    const taPerformance = await this.prisma.user.findMany({
      where: {
        role: { in: ['USER', 'MANAGER', 'RECRUITER', 'HEAD_OF_DEPARTMENT'] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        _count: { select: { picCandidates: true } },
      },
    });

    // Get status ORDER from DB to map status_order to IDs
    // status_id 1 = CV_FILTERING (not processed), >= 2 = processed
    // passed status_ids: 10, 12, 15, 16, 17, 18, 19, 20
    // accepted status_id: 20 (ONBOARDING_ACCEPTED)
    const statusOrderMap = allStatuses.reduce((acc, s) => {
      acc[s.id] = s.order;
      return acc;
    }, {} as Record<string, number>);

    // Get status counts for each user who has candidates assigned
    const taCandidateCounts = await this.prisma.candidate.groupBy({
      by: ['picId', 'statusId'],
      _count: { id: true },
      where: { picId: { not: null } },
    });

    // Offer sent status codes
    const OFFER_SENT_STATUS_CODES = ['OFFER_SENT'];
    // Offer accepted status codes
    const OFFER_ACCEPTED_STATUS_CODES = ['OFFER_ACCEPTED', 'WAITING_ONBOARDING', 'ONBOARDING_ACCEPTED'];
    // Passed status codes - statuses where candidate PASSED (manager result is "đạt")
    const PASSED_STATUS_CODES = [
      'SM_AM_INTERVIEW_PASSED',  // order 10 - SM/AM interview passed
      'NO_INTERVIEW',             // order 15 - showed up (considered passed)
      'OFFER_SENT',               // order 16 - offer sent (candidate was selected)
      'OFFER_ACCEPTED',           // order 17 - accepted offer
      'WAITING_ONBOARDING',       // order 19 - waiting to start (passed all stages)
      'ONBOARDING_ACCEPTED',      // order 20 - actually started working
    ];
    // Accepted = actually onboarded successfully (đồng ý nhận việc thành công)
    const ACCEPTED_STATUS_CODES = ['ONBOARDING_ACCEPTED'];
    const FIRST_STATUS_CODES = ['CV_FILTERING']; // status_id 1 = not processed

    // Build TA performance data
    const taPerformanceData = taPerformance.map(ta => {
      const taCounts = taCandidateCounts.filter(c => c.picId === ta.id);
      const total = taCounts.reduce((sum, c) => sum + c._count.id, 0);

      // Processed = any status != CV_FILTERING (first status)
      const processed = taCounts.filter(c => {
        const status = allStatuses.find(s => s.id === c.statusId);
        return status && !FIRST_STATUS_CODES.includes(status.code);
      }).reduce((sum, c) => sum + c._count.id, 0);
      
      const passed = taCounts.filter(c => {
        const status = allStatuses.find(s => s.id === c.statusId);
        return status && PASSED_STATUS_CODES.includes(status.code);
      }).reduce((sum, c) => sum + c._count.id, 0);

      const onboarded = taCounts.filter(c => {
        const status = allStatuses.find(s => s.id === c.statusId);
        return status && ACCEPTED_STATUS_CODES.includes(status.code);
      }).reduce((sum, c) => sum + c._count.id, 0);

      const offerSent = taCounts.filter(c => {
        const status = allStatuses.find(s => s.id === c.statusId);
        return status && OFFER_SENT_STATUS_CODES.includes(status.code);
      }).reduce((sum, c) => sum + c._count.id, 0);

      const offerAccepted = taCounts.filter(c => {
        const status = allStatuses.find(s => s.id === c.statusId);
        return status && OFFER_ACCEPTED_STATUS_CODES.includes(status.code);
      }).reduce((sum, c) => sum + c._count.id, 0);

      return {
        taId: ta.id,
        taName: ta.fullName,
        taEmail: ta.email,
        taRole: ta.role,
        totalCandidates: total,
        processedCandidates: processed,
        passedCandidates: passed,
        onboardedCandidates: onboarded,
        offerSentCandidates: offerSent,
        offerAcceptedCandidates: offerAccepted,
      };
    }).filter(ta => ta.totalCandidates > 0).sort((a, b) => b.totalCandidates - a.totalCandidates);

    return {
      totalCandidates,
      newCandidatesThisMonth,
      newCandidatesLastMonth,
      activeCampaigns,
      totalCampaigns,
      totalForms,
      totalProposals,
      candidatesByStatus: this.hasAnyFilter(candidateWhere) ? 
        allStatuses.map(s => ({
          ...candidatesByStatus.find(cs => cs.statusId === s.id)!,
          count: filteredCountsByStatus[s.id] || 0,
        })) : candidatesByStatus,
      candidatesByCampaign,
      candidatesByStore,
      monthlyData,
      funnelData,
      taPerformance: taPerformanceData,
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

  // ============================================================================
  // SOURCES DOMAIN - Candidate source management
  // ============================================================================

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

  async apply(data: any) {
    // Blacklist check for public applications
    if (data.phone || data.email) {
      const blacklistEntry = await this.checkBlacklist(data.phone, data.email);
      if (blacklistEntry) {
        throw new ForbiddenException(
          `Ứng viên nằm trong danh sách đen. Lý do: ${blacklistEntry.reason}`
        );
      }
    }

    const status = await this.prisma.candidateStatus.findUnique({
      where: { code: 'CV_FILTERING' }
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

    const { status: statusName, sourceCode, dateOfBirth, availableStartDate, ...rest } = data;
    
    // Convert date strings to DateTime
    let dateOfBirthDate: Date | undefined;
    let availableStartDateDate: Date | undefined;
    
    if (dateOfBirth) {
      // Handle both DD/MM/YYYY and YYYY-MM-DD formats
      if (dateOfBirth.includes('/')) {
        const [day, month, year] = dateOfBirth.split('/');
        dateOfBirthDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      } else {
        dateOfBirthDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
      }
    }
    
    if (availableStartDate) {
      if (availableStartDate.includes('/')) {
        const [day, month, year] = availableStartDate.split('/');
        availableStartDateDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      } else {
        availableStartDateDate = new Date(`${availableStartDate}T00:00:00.000Z`);
      }
    }
    
    // Create candidate with SLA tracking
    const candidate = await this.prisma.candidate.create({
      data: {
        ...rest,
        dateOfBirth: dateOfBirthDate,
        availableStartDate: availableStartDateDate,
        sourceId,
        statusId: status?.id,
        slaDueDate,
        priority: 'NORMAL',
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

    return candidate;
  }

  async getPublicStores() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        address: true
      },
      orderBy: { name: 'asc' }
    });
    // Fix UTF-8 encoding
    return stores.map(s => ({
      ...s,
      name: s.name,
      address: s.address,
      city: s.city,
    }));
  }

  // ============================================================================
  // PUBLIC API DOMAIN - Public endpoints for application form
  // ============================================================================

  async getPublicPositions() {
    const positions = await this.prisma.position.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    // Fix UTF-8 encoding
    return positions.map(p => ({
      ...p,
      name: p.name,
      description: p.description,
    }));
  }

  private hasAnyFilter(filter: Record<string, unknown>): boolean {
    return Object.keys(filter).length > 0
  }

  // ============================================================================
  // NOTIFICATIONS DOMAIN - User notification management
  // ============================================================================

  // Notifications
  async getNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { recipientId: userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.recipientId !== userId) {
      throw new ForbiddenException('Không có quyền cập nhật thông báo này');
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
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
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }
}
