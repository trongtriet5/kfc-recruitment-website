import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async getProvinces() {
    return this.prisma.province.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true }
    })
  }

  async getWardsByProvince(provinceId: string) {
    return this.prisma.ward.findMany({
      where: { 
        provinceId,
        isActive: true 
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true }
    })
  }

  async getWardsByProvinceCode(provinceCode: string) {
    const province = await this.prisma.province.findUnique({
      where: { code: provinceCode }
    })
    
    if (!province) return []
    
    return this.prisma.ward.findMany({
      where: { 
        provinceId: province.id,
        isActive: true 
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true }
    })
  }
}
