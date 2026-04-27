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

      if (user.role === 'USER') {
        // USER (SM): Can see candidates:
        // 1. Assigned as PIC
        // 2. In their managed store
        // 3. In campaigns created from proposals they created
        const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);

        where.OR = [
          { picId: user.id },  // Candidates where user is PIC
          { storeId: { in: storeIds } },  // Candidates in their managed store
          ...(campaignIdsFromUserProposals.length > 0
            ? [{ campaignId: { in: campaignIdsFromUserProposals } }]
            : [])  // Candidates in campaigns from user's proposals
        ];
      } else if (user.role !== 'ADMIN' && storeIds.length > 0) {
        // Other roles: filter by accessible stores
        where.storeId = { in: storeIds };
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

  async getCandidate(id: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        campaign: true,
        store: true,
        form: true,
        source: true,
        status: true,
        pic: { select: { id: true, fullName: true, email: true } },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Ứng viên không tồn tại');
    }

    // Check access for non-admin
    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);

      // USER (SM): Can access if:
      // 1. They're the PIC
      // 2. Store is in their accessible stores
      // 3. Campaign is from a proposal they created
      if (user.role === 'USER') {
        const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);
        const isFromUserProposal = candidate.campaignId && campaignIdsFromUserProposals.includes(candidate.campaignId);

        const canAccess = candidate.picId === user.id ||
          (candidate.storeId && storeIds.includes(candidate.storeId)) ||
          isFromUserProposal;
        if (!canAccess) return null;
      } else {
        // Other roles (MANAGER, RECRUITER, etc.): check store access
        if (!candidate.storeId || !storeIds.includes(candidate.storeId)) {
          return null;
        }
      }
    }

    return candidate;
  }

  async getTAs() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['USER', 'MANAGER', 'HEAD_OF_DEPARTMENT', 'ADMIN'] },
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

  async getStoreIdsByCity(city: string): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      where: { city, isActive: true },
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
        include: { managedStores: { select: { id: true } } }
      });
      return u?.managedStores?.map(s => s.id) || [];
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