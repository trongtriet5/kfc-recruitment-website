import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        managedStore: {
          select: { id: true, name: true, code: true, city: true }
        },
        amStores: {
          select: { id: true, name: true, code: true, city: true }
        },
      }
    });
  }

  async getForSelect() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: { not: 'ADMIN' } },
      select: { id: true, full_name: true, email: true },
      orderBy: { full_name: 'asc' }
    });
  }

  /** Returns all stores with SM/AM assignment info, for use in user create/edit form */
  async getStoresForAssign() {
    return this.prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        zone: true,
        group: true,
        amName: true,
        smId: true,
        amId: true,
        manager: { select: { id: true, full_name: true } },
        am: { select: { id: true, full_name: true } },
      },
      orderBy: [{ city: 'asc' }, { code: 'asc' }],
    });
  }

  async create(data: any) {
    // Check for duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existing) {
      throw new Error('Email đã được sử dụng');
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(data.password || 'kfc@123', SALT_ROUNDS);
    
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role || 'USER',
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    // Manual explicit store assignment takes priority
    if (data.storeId && (data.role === 'USER' || data.role === 'SM')) {
      await this.assignSMToStore(user.id, data.storeId);
    } else if (data.storeIds?.length && (data.role === 'MANAGER' || data.role === 'AM')) {
      await this.assignAMToStores(user.id, data.storeIds);
    } else {
      // Fallback: auto-match by name/email convention
      await this.assignUserToStoresByConvention(user);
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, full_name: true, phone: true, role: true, isActive: true,
        managedStore: { select: { id: true, name: true, code: true } },
        amStores: { select: { id: true, name: true, code: true } },
      }
    });
  }

  private async assignSMToStore(userId: string, storeId: string) {
    // Unassign any previously managed store for this user
    await this.prisma.store.updateMany({
      where: { smId: userId },
      data: { smId: null },
    });
    // Assign new store
    await this.prisma.store.update({
      where: { id: storeId },
      data: { smId: userId },
    });
  }

  private async assignAMToStores(userId: string, storeIds: string[]) {
    // Remove AM from any stores previously managed by this user
    await this.prisma.store.updateMany({
      where: { amId: userId },
      data: { amId: null },
    });
    // Assign to new stores
    if (storeIds.length > 0) {
      await this.prisma.store.updateMany({
        where: { id: { in: storeIds } },
        data: { amId: userId },
      });
    }
  }

  /** Legacy auto-match by name/email convention (used for imports) */
  private async assignUserToStoresByConvention(user: any) {
    if (user.role === 'MANAGER') {
      await this.prisma.store.updateMany({
        where: { amName: user.full_name },
        data: { amId: user.id }
      });
    } else if (user.role === 'USER') {
      const match = user.email.match(/^sm\.([a-z0-9.]+)@kfcvietnam\.com\.vn$/i);
      if (match) {
        const slug = match[1].toLowerCase();
        const stores = await this.prisma.store.findMany({
          where: { smId: null },
          select: { id: true, code: true }
        });
        const store = stores.find(s => {
          const storeSlug = s.code.toLowerCase().replace(/[^a-z0-9]/g, '.');
          return storeSlug === slug;
        });
        if (store) {
          await this.prisma.store.update({
            where: { id: store.id },
            data: { smId: user.id }
          });
        }
      }
    }
  }

  async update(id: string, data: any) {
    // Check for duplicate email if email is being changed
    if (data.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id } }
      });
      if (existing) {
        throw new Error('Email đã được sử dụng bởi tài khoản khác');
      }
    }

    const updateData: any = { ...data };
    
    // Map fullName to full_name for Prisma
    if (updateData.fullName) {
      updateData.full_name = updateData.fullName;
      delete updateData.fullName;
    }
    
    // Hash the password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    } else {
      delete updateData.password;
    }

    // Extract store assignment fields before passing to prisma
    const storeId: string | undefined = updateData.storeId;
    const storeIds: string[] | undefined = updateData.storeIds;
    delete updateData.storeId;
    delete updateData.storeIds;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData
    });

    const role = updateData.role || user.role;

    if (storeId !== undefined && (role === 'USER' || role === 'SM')) {
      if (storeId) {
        await this.assignSMToStore(id, storeId);
      } else {
        // Unassign
        await this.prisma.store.updateMany({ where: { smId: id }, data: { smId: null } });
      }
    } else if (storeIds !== undefined && (role === 'MANAGER' || role === 'AM')) {
      await this.assignAMToStores(id, storeIds);
    }

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, full_name: true, phone: true, role: true, isActive: true,
        managedStore: { select: { id: true, name: true, code: true } },
        amStores: { select: { id: true, name: true, code: true } },
      }
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async importUsers(data: any) {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const user of data.users || []) {
      try {
        const existing = await this.prisma.user.findUnique({ where: { email: user.email } });

        if (existing) {
          const updateData: any = {
            full_name: user.full_name || existing.full_name,
            phone: user.phone,
            role: user.role || existing.role,
            isActive: user.isActive !== undefined ? user.isActive : existing.isActive,
          };
          // Hash new password if provided
          if (user.password) {
            updateData.password = await bcrypt.hash(user.password, SALT_ROUNDS);
          }
          
          await this.prisma.user.update({
            where: { id: existing.id },
            data: updateData
          });
        } else {
          const newUser = await this.prisma.user.create({
            data: {
              email: user.email,
              password: await bcrypt.hash(user.password || 'kfc@123', SALT_ROUNDS),
              full_name: user.full_name,
              phone: user.phone,
              role: user.role || 'USER',
              isActive: user.isActive !== undefined ? user.isActive : true,
            }
          });
          await this.assignUserToStoresByConvention(newUser);
        }
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Lỗi import ${user.email || 'unknown'}: ${error.message}`);
      }
    }

    return results;
  }
}
