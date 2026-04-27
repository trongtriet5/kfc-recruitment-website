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

    // Apply store scoping for SM/AM
    if (user) {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (storeIds.length > 0 && user.role !== 'ADMIN') {
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
      if (!candidate.storeId || !storeIds.includes(candidate.storeId)) {
        return null;
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
}