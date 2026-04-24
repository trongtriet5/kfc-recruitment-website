import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  async getForSelect() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' }
    });
  }

  async create(data: any) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password || 'kfc@123',
        fullName: data.fullName,
        phone: data.phone,
        role: data.role || 'USER',
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });
  }

  async update(id: string, data: any) {
    const updateData: any = { ...data };
    if (!updateData.password) {
      delete updateData.password;
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  async importUsers(data: any) {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const user of data.users || []) {
      try {
        const existing = await this.prisma.user.findUnique({
          where: { email: user.email }
        });
        
        if (existing) {
          await this.prisma.user.update({
            where: { id: existing.id },
            data: {
              fullName: user.fullName || existing.fullName,
              phone: user.phone,
              role: user.role || existing.role,
              isActive: user.isActive !== undefined ? user.isActive : existing.isActive,
            }
          });
        } else {
          await this.prisma.user.create({
            data: {
              email: user.email,
              password: user.password || 'kfc@123',
              fullName: user.fullName,
              phone: user.phone,
              role: user.role || 'USER',
              isActive: user.isActive !== undefined ? user.isActive : true,
            }
          });
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Lỗi import ${user.email || 'unknown'}: ${error.message}`);
      }
    }
    
    return results;
  }
}
