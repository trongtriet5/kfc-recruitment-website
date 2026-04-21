import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

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
  async getStores() {
    return this.prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getStore(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async createStore(data: any) {
    const existing = await this.prisma.store.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Store ${data.code} already exists`);
    return this.prisma.store.create({ data });
  }

  async updateStore(id: string, data: any) {
    return this.prisma.store.update({ where: { id }, data });
  }

  async deleteStore(id: string) {
    return this.prisma.store.update({ where: { id }, data: { isActive: false } });
  }
}
