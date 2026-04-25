import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async getProvinces() {
    const provinces = await this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      select: { code: true, name: true, fullName: true }
    })
    // Map code to id for frontend compatibility
    return provinces.map(p => ({ ...p, id: p.code }))
  }

  async getWardsByProvince(provinceCode: string) {
    const wards = await this.prisma.ward.findMany({
      where: { 
        provinceCode
      },
      orderBy: { name: 'asc' },
      select: { code: true, name: true, fullName: true }
    })
    // Map code to id for frontend compatibility
    return wards.map(w => ({ ...w, id: w.code }))
  }

  async getWardsByProvinceCode(provinceCode: string) {
    return this.getWardsByProvince(provinceCode)
  }
}
