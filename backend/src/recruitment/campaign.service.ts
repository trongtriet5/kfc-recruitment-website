import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

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

    const campaigns = await this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    // Hydrate store, candidate count, and form (if needed)
    return await Promise.all(campaigns.map(async (c) => {
      // Hydrate store info
      const store = c.storeId ? await this.prisma.store.findUnique({
        where: { id: c.storeId },
        select: { id: true, name: true, code: true }
      }) : null;

      // Count candidates
      const candidateCount = await this.prisma.candidate.count({ where: { campaignId: c.id } });

      // Hydrate form info
      const form = c.formId ? await this.prisma.recruitmentForm.findUnique({ where: { id: c.formId } }) : null;

      return {
        ...c,
        store,
        candidateCount,
        form
      };
    }));
  }

  async getCampaign(id: string, user?: any) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
if (!campaign) return null;
const store = campaign.storeId ? await this.prisma.store.findUnique({ where: { id: campaign.storeId } }) : null;
const form = campaign.formId ? await this.prisma.recruitmentForm.findUnique({ where: { id: campaign.formId } }) : null;
const candidates = await this.prisma.candidate.findMany({ where: { campaignId: id } });
return {
  ...campaign,
  store,
  form,
  candidates
};
  }

  async getCampaignByLink(link: string) {
    return this.prisma.campaign.findUnique({
      where: { link }
    });
  }

  async getCampaignStatistics(campaignId?: string) {
    const where: any = campaignId ? { id: campaignId } : {};

    const campaigns = await this.prisma.campaign.findMany({
      where,
      select: {
        id: true
      },
    });
    // Count all candidates for these campaigns
    let total = 0;
    let byStatus: Record<string, number> = {};
    if (campaigns.length) {
      const campaignIds = campaigns.map(c => c.id);
      // Count candidates
      total = await this.prisma.candidate.count({
        where: {
          campaignId: { in: campaignIds }
        }
      });
      // If specific campaign, get breakdown by status
      if (campaignId) {
        const candidates = await this.prisma.candidate.findMany({
          where: { campaignId },
          select: { statusId: true }
        });
        // Map statusId → code
        const statusIds = candidates.map(c => c.statusId).filter(x => !!x);
        let statusCodes: Record<string, string> = {};
        if (statusIds.length) {
          const statuses = await this.prisma.candidateStatus.findMany({
            where: { id: { in: statusIds as string[] } },
            select: { id: true, code: true }
          });
          statuses.forEach(s => {
            statusCodes[s.id] = s.code;
          });
        }
        byStatus = candidates.reduce((acc, c) => {
          const code = c.statusId ? statusCodes[c.statusId] || 'unknown' : 'unknown';
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }
    return { total, byStatus };
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
        include: { amStores: { select: { id: true } } }
      });
      return u?.amStores?.map(s => s.id) || [];
    }

    return [];
  }
}