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
    return this.prisma.campaign.findUnique({
      where: { id },
      include: { 
        form: true, 
        candidates: true, 
        store: true
      },
    });
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
}