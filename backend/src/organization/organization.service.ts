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
    provinceCode: true,
    wardCode: true,
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
    province: { select: { code: true, name: true, fullName: true } },
    ward: { select: { code: true, name: true, fullName: true } },
    manager: { select: { id: true, fullName: true, email: true } },
    am: { select: { id: true, fullName: true, email: true } },
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
      district,
      phone,
      city,
      area,
      ...rest
    } = data || {};

    return {
      ...rest,
      amName: amName ?? am,
      omName: omName ?? om,
      odName: odName ?? od,
      provinceCode: rest.provinceCode === '' ? null : rest.provinceCode,
      wardCode: rest.wardCode === '' ? null : rest.wardCode,
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
      city: store.province?.fullName || store.province?.name || null,
      district: store.ward?.fullName || store.ward?.name || null,
      provinceCode: store.provinceCode ?? null,
      wardCode: store.wardCode ?? null,
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
    
    const mappedData = this.mapStorePayload(data);
    const { provinceCode, wardCode, ...restData } = mappedData;
    
    const createData: any = {
      ...restData,
      ...(provinceCode && { province: { connect: { code: provinceCode } } }),
      ...(wardCode && { ward: { connect: { code: wardCode } } }),
    };
    
    const store = await this.prisma.store.create({ data: createData, select: this.storeSelect });
    this.cache.delete(CACHE_KEYS.STORES_ACTIVE);
    return this.mapStoreResponse(store);
  }

  async updateStore(id: string, data: any) {
    const mappedData = this.mapStorePayload(data);
    
    // Extract relation fields for connect syntax
    const { provinceCode, wardCode, ...restData } = mappedData;
    
    const updateData: any = {
      ...restData,
      ...(provinceCode && { province: { connect: { code: provinceCode } } }),
      ...(provinceCode === null && { province: { disconnect: true } }),
      ...(wardCode && { ward: { connect: { code: wardCode } } }),
      ...(wardCode === null && { ward: { disconnect: true } }),
    };
    
    const store = await this.prisma.store.update({ where: { id }, data: updateData, select: this.storeSelect });
    this.cache.delete(CACHE_KEYS.STORES_ACTIVE);
    return this.mapStoreResponse(store);
  }

  async deleteStore(id: string) {
    const store = await this.prisma.store.update({ where: { id }, data: { isActive: false }, select: this.storeSelect });
    this.cache.delete(CACHE_KEYS.STORES_ACTIVE);
    return this.mapStoreResponse(store);
  }

  async importStore(data: any) {
    const mappedData = this.mapStorePayload(data);
    const { provinceCode, wardCode, ...restData } = mappedData;

    const baseData: any = { ...restData };

    if (provinceCode && String(provinceCode).trim() !== '') {
      const provinceValue = String(provinceCode).trim();
      let province: any = null;

      const provinces = await this.prisma.$queryRaw`SELECT code, name, full_name FROM provinces`;
      const provinceList = (provinces as any[]).map(r => this.convertBigInt(r));

      province = provinceList.find(p =>
        p.code === provinceValue ||
        p.name.toLowerCase().trim() === provinceValue.toLowerCase().trim() ||
        p.full_name.toLowerCase().trim() === provinceValue.toLowerCase().trim()
      );

      if (!province) {
        province = provinceList.find(p =>
          p.name.toLowerCase().trim().includes(provinceValue.toLowerCase().trim()) ||
          provinceValue.toLowerCase().trim().includes(p.name.toLowerCase().trim())
        );
      }

      if (!province) {
        province = provinceList.find(p =>
          p.full_name.toLowerCase().trim().includes(provinceValue.toLowerCase().trim()) ||
          provinceValue.toLowerCase().trim().includes(p.full_name.toLowerCase().trim())
        );
      }

      if (province) {
        baseData.province = { connect: { code: String(province.code) } };
      }
    }

    if (wardCode && String(wardCode).trim() !== '') {
      const wardValue = String(wardCode).trim();
      let ward: any = null;

      const wards = await this.prisma.$queryRaw`SELECT code, name, full_name FROM wards`;
      const wardList = (wards as any[]).map(r => this.convertBigInt(r));

      ward = wardList.find(w =>
        w.code === wardValue ||
        w.name.toLowerCase().trim() === wardValue.toLowerCase().trim() ||
        w.full_name.toLowerCase().trim() === wardValue.toLowerCase().trim()
      );

      if (!ward) {
        ward = wardList.find(w =>
          w.name.toLowerCase().trim().includes(wardValue.toLowerCase().trim()) ||
          wardValue.toLowerCase().trim().includes(w.name.toLowerCase().trim())
        );
      }

      if (!ward) {
        ward = wardList.find(w =>
          w.full_name.toLowerCase().trim().includes(wardValue.toLowerCase().trim()) ||
          wardValue.toLowerCase().trim().includes(w.full_name.toLowerCase().trim())
        );
      }

      if (ward) {
        baseData.ward = { connect: { code: String(ward.code) } };
      }
    }

    const existing = await this.prisma.store.findUnique({ where: { code: data.code }, select: { id: true } });
    if (existing) {
      const store = await this.prisma.store.update({ where: { id: existing.id }, data: baseData, select: this.storeSelect });
      return this.mapStoreResponse(store);
    } else {
      const store = await this.prisma.store.create({ data: { code: data.code, name: data.name, ...baseData }, select: this.storeSelect });
      this.cache.delete(CACHE_KEYS.STORES_ACTIVE);
      return this.mapStoreResponse(store);
    }
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
        name: province.fullName || province.name,
        unit: unit?.[0]?.short_name || null
      } : null,
      ward: ward ? {
        code: ward.code,
        name: ward.fullName || ward.name,
        unit: ward.administrative_unit_id ? await this.getAdministrativeUnitName(ward.administrative_unit_id) : null
      } : null
    };
  }

  private async getAdministrativeUnitName(id: number) {
    const results = await this.prisma.$queryRaw`SELECT short_name FROM administrative_units WHERE id = ${id}`;
    return results[0]?.short_name || null;
  }
}
