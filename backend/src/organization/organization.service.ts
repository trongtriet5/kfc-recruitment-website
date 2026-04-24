import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

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
    sm: { select: { id: true, fullName: true, email: true } },
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

    return {
      ...store,
      am: store.am ?? store.amName ?? null,
      om: store.omName ?? null,
      od: store.odName ?? null,
      taIncharge: store.taIncharge ?? null,
      group: store.group ?? null,
    };
  }

  // Departments
  async getDepartments() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(data: any) {
    const existing = await this.prisma.department.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Department ${data.code} already exists`);
    return this.prisma.department.create({ data });
  }

  async updateDepartment(id: string, data: any) {
    return this.prisma.department.update({ where: { id }, data });
  }

  async deleteDepartment(id: string) {
    return this.prisma.department.update({ where: { id }, data: { isActive: false } });
  }

  // Positions
  async getPositions() {
    return this.prisma.position.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createPosition(data: any) {
    const existing = await this.prisma.position.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Position ${data.code} already exists`);
    return this.prisma.position.create({ data });
  }

  async updatePosition(id: string, data: any) {
    return this.prisma.position.update({ where: { id }, data });
  }

  async deletePosition(id: string) {
    return this.prisma.position.update({ where: { id }, data: { isActive: false } });
  }

  // Stores
  async getStores(user?: any) {
    const where: any = { isActive: true };
    
    // Filter by user access for SM/AM
    if (user && user.role !== 'ADMIN') {
      const userWithStore = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { 
          managedStore: { select: { id: true } },
          managedStores: { select: { id: true } }
        }
      });
      
      if (user.role === 'USER' && userWithStore?.managedStore) {
        where.id = userWithStore.managedStore.id;
      } else if (user.role === 'MANAGER' && userWithStore?.managedStores?.length > 0) {
        where.id = { in: userWithStore.managedStores.map(s => s.id) };
      }
    }

    const stores = await this.prisma.store.findMany({
      where,
      select: this.storeSelect,
      orderBy: { name: 'asc' },
    });

    return stores.map((store) => this.mapStoreResponse(store));
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
    return this.mapStoreResponse(store);
  }

  async updateStore(id: string, data: any) {
    const store = await this.prisma.store.update({ where: { id }, data: this.mapStorePayload(data), select: this.storeSelect });
    return this.mapStoreResponse(store);
  }

  async deleteStore(id: string) {
    const store = await this.prisma.store.update({ where: { id }, data: { isActive: false }, select: this.storeSelect });
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
  async getProvinces(regionId?: number) {
    let results: any[];
    if (regionId) {
      results = await this.prisma.$queryRaw`SELECT * FROM provinces WHERE administrative_region_id = ${regionId} ORDER BY name`;
    } else {
      results = await this.prisma.$queryRaw`SELECT * FROM provinces ORDER BY name`;
    }
    return results.map((r: any) => this.convertBigInt(r));
  }

  async getProvince(code: bigint) {
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM provinces WHERE code = ${code}`;
    return results[0] ? this.convertBigInt(results[0]) : null;
  }

  // Administrative Units (Cấp hành chính)
  async getAdministrativeUnits() {
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM administrative_units ORDER BY short_name`;
    return results.map((r: any) => this.convertBigInt(r));
  }

  // Wards (Phường/Xã)
  async getWards(provinceCode?: bigint, unitId?: number) {
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

  async getWard(code: bigint) {
    const results: any[] = await this.prisma.$queryRaw`SELECT * FROM wards WHERE code = ${code}`;
    return results[0] ? this.convertBigInt(results[0]) : null;
  }

  // Get full address hierarchy
  async getAddressHierarchy(provinceCode: bigint, wardCode: bigint) {
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
