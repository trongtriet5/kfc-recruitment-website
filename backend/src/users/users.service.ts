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
}
