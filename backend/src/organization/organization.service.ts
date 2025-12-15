import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getDepartments() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getPositions() {
    return this.prisma.position.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getStores() {
    return this.prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}

