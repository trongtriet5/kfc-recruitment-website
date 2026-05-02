import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CandidateReadService {
  constructor(private prisma: PrismaService) {}

  async getCandidates(filters?: any, user?: any) {
    const where: any = {};
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
    if (user) {
      const storeIds = await this.getAccessibleStoreIds(user);

      if (user.role === 'USER' || user.role === 'MANAGER') {
        // SM or AM: Can see candidates:
        // 1. Assigned as PIC (interviewer)
        // 2. In their managed store(s)
        // 3. In campaigns created from proposals they created
        const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);

        where.OR = [
          { picId: user.id },  // Candidates where user is PIC
          { storeId: { in: storeIds } },  // Candidates in their managed store(s)
          ...(campaignIdsFromUserProposals.length > 0
            ? [{ campaignId: { in: campaignIdsFromUserProposals } }]
            : [])  // Candidates in campaigns from user's proposals
        ];
      } else if (user.role === 'RECRUITER') {
        // Recruiter can see all active candidates in their assigned scope
        // (Currently scope is all stores for RECRUITER based on STORE_HIERARCHY)
        if (storeIds.length > 0) {
          where.storeId = { in: storeIds };
        }
      }
    }

    // Exclude deleted records
    where.deletedAt = null;

    // Pagination
    const page = filters?.page ? parseInt(filters.page, 10) : 1;
    const limit = filters?.limit ? parseInt(filters.limit, 10) : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        // PRISMA RELATIONS REMOVED: Hydrate manually later
        
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.candidate.count({ where }),
    ]);

    // Hydrate related data manually
    const campaignIds = [...new Set(data.map(c => c.campaignId).filter(Boolean))];
    const storeIds    = [...new Set(data.map(c => c.storeId).filter(Boolean))];
    const formIds     = [...new Set(data.map(c => c.formId).filter(Boolean))];
    const sourceIds   = [...new Set(data.map(c => c.sourceId).filter(Boolean))];
    const statusIds   = [...new Set(data.map(c => c.statusId).filter(Boolean))];
    const picIds      = [...new Set(data.map(c => c.picId).filter(Boolean))];

    const [campaigns, stores, forms, sources, statuses, pics] = await Promise.all([
      campaignIds.length ? this.prisma.campaign.findMany({ where: { id: { in: campaignIds }} }) : [],
      storeIds.length    ? this.prisma.store.findMany({ where: { id: { in: storeIds }} }) : [],
      formIds.length     ? this.prisma.recruitmentForm.findMany({ where: { id: { in: formIds }} }) : [],
      sourceIds.length   ? this.prisma.source.findMany({ where: { id: { in: sourceIds }} }) : [],
      statusIds.length   ? this.prisma.candidateStatus.findMany({ where: { id: { in: statusIds }} }) : [],
      picIds.length      ? this.prisma.user.findMany({ where: { id: { in: picIds } }, select: { id: true, fullName: true, email: true } }) : [],
    ]);
    const campaignMap = Object.fromEntries(campaigns.map(x=>[x.id,x]));
    const storeMap    = Object.fromEntries(stores.map(x=>[x.id,x]));
    const formMap     = Object.fromEntries(forms.map(x=>[x.id,x]));
    const sourceMap   = Object.fromEntries(sources.map(x=>[x.id,x]));
    const statusMap   = Object.fromEntries(statuses.map(x=>[x.id,x]));
    const picMap      = Object.fromEntries(pics.map(x=>[x.id,x]));

    const results = data.map(c => ({
      ...c,
      campaign: c.campaignId ? campaignMap[c.campaignId] || null : null,
      store: c.storeId ? storeMap[c.storeId] || null : null,
      form: c.formId ? formMap[c.formId] || null : null,
      source: c.sourceId ? sourceMap[c.sourceId] || null : null,
      status: c.statusId ? statusMap[c.statusId] || null : null,
      pic: c.picId ? picMap[c.picId] || null : null
    }));

    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCandidate(id: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate) {
      throw new NotFoundException('Ứng viên không tồn tại');
    }

    // Hydrate relations + auditLogs
    const [
      campaign,
      store,
      form,
      source,
      status,
      pic,
      interviews,
      auditLogsRaw
    ] = await Promise.all([
      candidate.campaignId ? this.prisma.campaign.findUnique({ where: { id: candidate.campaignId } }) : null,
      candidate.storeId ? this.prisma.store.findUnique({ where: { id: candidate.storeId } }) : null,
      candidate.formId ? this.prisma.recruitmentForm.findUnique({ where: { id: candidate.formId } }) : null,
      candidate.sourceId ? this.prisma.source.findUnique({ where: { id: candidate.sourceId }, select: { id: true, name: true, code: true } }) : null,
      candidate.statusId ? this.prisma.candidateStatus.findUnique({ where: { id: candidate.statusId } }) : null,
      candidate.picId ? this.prisma.user.findUnique({ where: { id: candidate.picId }, select: { id: true, fullName: true, email: true } }) : null,
      this.prisma.interview.findMany({
        where: { candidateId: candidate.id },
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: {
          interviewer: {
            select: { 
              id: true, 
              fullName: true, 
              email: true 
            }
          }
        }
      }),
      this.prisma.candidateAuditLog.findMany({
        where: { candidateId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          actorId: true,
          action: true,
          fromValue: true,
          toValue: true,
          notes: true,
          campaignId: true,
          createdAt: true
        }
      })
    ]);

    // Hydrate preferredStoreNames
    let preferredStoreNames: string[] = [];
    if (candidate.preferredLocations && candidate.preferredLocations.length > 0) {
      const pStores = await this.prisma.store.findMany({
        where: { id: { in: candidate.preferredLocations } },
        select: { name: true, code: true }
      });
      preferredStoreNames = pStores.map(s => s.code ? `${s.name} (${s.code})` : s.name);
    }

    // Hydrate audit logs
    const actorIds = auditLogsRaw.map(log => log.actorId as string).filter(Boolean);
    const auditCampaignIds = auditLogsRaw.map(log => log.campaignId as string).filter(Boolean);
    
    const [actors, auditCampaigns] = await Promise.all([
      actorIds.length ? this.prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, fullName: true }
      }) : [],
      auditCampaignIds.length ? this.prisma.campaign.findMany({
        where: { id: { in: auditCampaignIds } },
        select: { id: true, name: true }
      }) : []
    ]);
    
    const actorMap = Object.fromEntries(actors.map(a => [a.id, a]));
    const auditCampaignMap = Object.fromEntries(auditCampaigns.map(c => [c.id, c]));

    const auditLogs = auditLogsRaw.map(log => ({
      ...log,
      actor: actorMap[log.actorId as string] || null,
      campaign: auditCampaignMap[log.campaignId as string] || null
    }));

    const hydrated = {
      ...candidate,
      campaign,
      store,
      form,
      source,
      status,
      pic,
      interviews,
      auditLogs,
      preferredStoreNames
    };

    // Check access for non-admin
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);

      // USER (SM): Can access if:
      // 1. They're the PIC
      // 2. Store is in their accessible stores
      // 3. Campaign is from a proposal they created
      if (user.role === 'USER' || user.role === 'MANAGER') {
        const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);
        const isFromUserProposal = candidate.campaignId && campaignIdsFromUserProposals.includes(candidate.campaignId);

        const canAccess = candidate.picId === user.id ||
          (candidate.storeId && storeIds.includes(candidate.storeId)) ||
          isFromUserProposal;
        if (!canAccess) return null;
      } else if (user.role !== 'ADMIN') {
        // Other roles (RECRUITER, etc.): check store access
        if (candidate.storeId && !storeIds.includes(candidate.storeId)) {
          return null;
        }
      }
    }

    return hydrated;
  }

  async getTAs() {
    return this.prisma.user.findMany({
      where: {
        role: 'RECRUITER',
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async getStoreIdsByCity(provinceCode: string): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      where: { provinceCode, isActive: true },
      select: { id: true }
    });
    return stores.map(s => s.id);
  }

  async getAccessibleStoreIds(user: any): Promise<string[]> {
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
        include: { amStores: { select: { id: true } } }
      });
      return u?.amStores?.map(s => s.id) || [];
    }

    if (user.role === 'RECRUITER') {
      const stores = await this.prisma.store.findMany({ select: { id: true } });
      return stores.map(s => s.id);
    }

    return [];
  }

  /**
   * Get campaign IDs from proposals created by the user
   * This allows proposal creators to see candidates in campaigns created from their proposals
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
