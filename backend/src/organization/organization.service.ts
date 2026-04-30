import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, CACHE_KEYS } from '../common/cache.service';

// Helper to fix UTF-8 encoding issues
function fixUtf8Encoding(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => fixUtf8Encoding(item));
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === 'string') {
        result[key] = value;
      } else {
        result[key] = fixUtf8Encoding(value);
      }
    }
    return result;
  }
  return obj;
}

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  private readonly storeSelect = {
    id: true,
    name: true,
    code: true,
    address: true,
    city: true,
    zone: true,
    brand: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    amName: true,
    omName: true,
    odName: true,
    group: true,
    smId: true,
    amId: true,
    manager: { select: { id: true, full_name: true, email: true } },
    am: { select: { id: true, full_name: true, email: true } },
  } as const;

  private mapStorePayload(data: any) {
    const {
      am,
      om,
      od,
      taIncharge,
      amName,
      omName,
      odName,
      ...rest
    } = data || {};

    return {
      ...rest,
      amName: amName ?? am,
      omName: omName ?? om,
      odName: odName ?? od,
    };
  }

  private mapStoreResponse(store: any) {
    if (!store) return store;

    return fixUtf8Encoding({
      ...store,
      am: store.am ?? store.amName ?? null,
      om: store.omName ?? null,
      od: store.odName ?? null,
      taIncharge: store.taIncharge ?? null,
      group: store.group ?? null,
    });
  }


// Positions
  async getPositions() {
    const cached = this.cache.get<any[]>(CACHE_KEYS.POSITIONS_ACTIVE);
    if (cached) return cached;

    const positions = await this.prisma.position.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    const result = positions.map(p => ({
      ...p,
      id: p.id,
      name: p.name,
      code: p.code,
      isActive: p.isActive,
    }));
    this.cache.set(CACHE_KEYS.POSITIONS_ACTIVE, result);
    return result;
  }

  async createPosition(data: any) {
    const existing = await this.prisma.position.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Position ${data.code} already exists`);
    const result = await this.prisma.position.create({ data });
    this.cache.delete(CACHE_KEYS.POSITIONS_ACTIVE);
    return result;
  }

  async updatePosition(id: string, data: any) {
    const result = await this.prisma.position.update({ where: { id }, data });
    this.cache.delete(CACHE_KEYS.POSITIONS_ACTIVE);
    return result;
  }

  async deletePosition(id: string) {
    const result = await this.prisma.position.update({ where: { id }, data: { isActive: false } });
    this.cache.delete(CACHE_KEYS.POSITIONS_ACTIVE);
    return result;
  }

  // Stores
  async getStores(user?: any) {
    // Only cache for admin (no user filter)
    if (!user || user.role === 'ADMIN') {
      const cached = this.cache.get<any[]>(CACHE_KEYS.STORES_ACTIVE);
      if (cached) return cached;
    }

    const where: any = { isActive: true };
    
    // Filter by user access for SM/AM
    if (user && user.role !== 'ADMIN') {
      const userWithStore = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { 
          managedStore: { select: { id: true } },
          amStores: { select: { id: true } }
        }
      });
      
      if (user.role === 'USER' && userWithStore?.managedStore) {
        where.id = userWithStore.managedStore.id;
      } else if (user.role === 'MANAGER' && userWithStore?.amStores?.length > 0) {
        where.id = { in: userWithStore.amStores.map(s => s.id) };
      }
    }

    const stores = await this.prisma.store.findMany({
      where,
      select: this.storeSelect,
      orderBy: { name: 'asc' },
    });

    const result = fixUtf8Encoding(stores.map((store) => this.mapStoreResponse(store)));

    // Cache for admin
    if (!user || user.role === 'ADMIN') {
      this.cache.set(CACHE_KEYS.STORES_ACTIVE, result);
    }

    return result;
  }

  async getStore(id: string, user?: any) {
    const store = await this.prisma.store.findUnique({ 
      where: { id },
      select: this.storeSelect,
    });
    if (!store) throw new NotFoundException('Store not found');
    return this.mapStoreResponse(store);
  }

  async createStore(data: any) {
    const existing = await this.prisma.store.findUnique({ where: { code: data.code }, select: { id: true } });
    if (existing) throw new ConflictException(`Store ${data.code} already exists`);
    const store = await this.prisma.store.create({ data: this.mapStorePayload(data), select: this.storeSelect });
    this.cache.delete(CACHE_KEYS.STORES_ACTIVE);
    return this.mapStoreResponse(store);
  }

  async updateStore(id: string, data: any) {
    const store = await this.prisma.store.update({ where: { id }, data: this.mapStorePayload(data), select: this.storeSelect });
    this.cache.delete(CACHE_KEYS.STORES_ACTIVE);
    return this.mapStoreResponse(store);
  }

  async deleteStore(id: string) {
    const store = await this.prisma.store.update({ where: { id }, data: { isActive: false }, select: this.storeSelect });
    this.cache.delete(CACHE_KEYS.STORES_ACTIVE);
    return this.mapStoreResponse(store);
  }

// Helper to convert BigInt values to numbers for JSON serialization
  private convertBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(item => this.convertBigInt(item));
    if (typeof obj === 'bigint') return Number(obj);
    
    const result: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      result[key] = typeof value === 'bigint' ? Number(value) : value;
    }
    return result;
  }

  // Administrative Regions (Vùng)
  async getRegions() {
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM administrative_regions ORDER BY name`;
    return results.map((r: any) => this.convertBigInt(r));
  }

  // Provinces (Tỉnh/Thành)
  async getProvinces() {
    // Note: administrative_region_id is not in the new schema, so we return all provinces
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM provinces ORDER BY name`;
    return results.map((r: any) => this.convertBigInt(r));
  }

  async getProvince(code: string) {
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM provinces WHERE code = ${code}`;
    return results[0] ? this.convertBigInt(results[0]) : null;
  }

  // Administrative Units (Cấp hành chính)
  async getAdministrativeUnits() {
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM administrative_units ORDER BY short_name`;
    return results.map((r: any) => this.convertBigInt(r));
  }

  // Wards (Phường/Xã)
  async getWards(provinceCode?: string, unitId?: number) {
    let results: any[];
    if (provinceCode && unitId) {
      results = await this.prisma.$queryRaw`SELECT * FROM wards WHERE province_code = ${provinceCode} AND administrative_unit_id = ${unitId} ORDER BY name`;
    } else if (provinceCode) {
      results = await this.prisma.$queryRaw`SELECT * FROM wards WHERE province_code = ${provinceCode} ORDER BY name`;
    } else {
      results = await this.prisma.$queryRaw`SELECT * FROM wards ORDER BY name`;
    }
    return results.map((r: any) => this.convertBigInt(r));
  }

  async getWard(code: string) {
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM wards WHERE code = ${code}`;
    return results[0] ? this.convertBigInt(results[0]) : null;
  }

  // Get full address hierarchy
  async getAddressHierarchy(provinceCode: string, wardCode: string) {
    const province = await this.getProvince(provinceCode);
    const ward = await this.getWard(wardCode);
    const unit = province?.administrative_unit_id 
      ? await this.prisma.$queryRaw`SELECT * FROM administrative_units WHERE id = ${province.administrative_unit_id}`
      : null;
    
    return {
      province: province ? {
        code: province.code,
        name: province.full_name || province.name,
        unit: unit?.[0]?.short_name || null
      } : null,
      ward: ward ? {
        code: ward.code,
        name: ward.full_name || ward.name,
        unit: ward.administrative_unit_id ? await this.getAdministrativeUnitName(ward.administrative_unit_id) : null
      } : null
    };
  }

  private async getAdministrativeUnitName(id: number) {
    const results = await this.prisma.$queryRaw`SELECT short_name FROM administrative_units WHERE id = ${id}`;
    return results[0]?.short_name || null;
  }
}
