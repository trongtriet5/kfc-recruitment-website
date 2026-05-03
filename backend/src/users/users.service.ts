import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as ExcelJS from 'exceljs';
import readXlsxFile from 'read-excel-file/node';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        roleId: true,
        roleObj: true,
        isActive: true,
        createdAt: true,
        managedStore: {
          select: { id: true, name: true, code: true, provinceCode: true, province: { select: { code: true, name: true, fullName: true } } }
        },
        amStores: {
          select: { id: true, name: true, code: true, provinceCode: true, province: { select: { code: true, name: true, fullName: true } } }
        },
      }
    });
    return users.map(u => ({
      ...u,
      managedStore: u.managedStore ? { ...u.managedStore, city: u.managedStore.province?.fullName || u.managedStore.province?.name || null } : null,
      managedStores: u.amStores?.map(s => ({ ...s, city: s.province?.fullName || s.province?.name || null })) || [],
    }));
  }

  async getForSelect() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: { not: 'ADMIN' } },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' }
    });
  }

  /** Returns all stores with SM/AM assignment info, for use in user create/edit form */
  async getStoresForAssign() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        provinceCode: true,
        zone: true,
        group: true,
        amName: true,
        smId: true,
        amId: true,
        province: { select: { code: true, name: true, fullName: true } },
        manager: { select: { id: true, fullName: true } },
        am: { select: { id: true, fullName: true } },
      },
      orderBy: [{ provinceCode: 'asc' }, { code: 'asc' }],
    });
    return stores.map(s => ({
      ...s,
      city: s.province?.fullName || s.province?.name || 'Khác',
    }));
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
    
    // Find role code from roleId to keep 'role' string in sync
    let roleCode = data.role || 'SM';
    if (data.roleId) {
      const dbRole = await this.prisma.role.findUnique({ where: { id: data.roleId } });
      if (dbRole) roleCode = dbRole.code;
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        phone: data.phone,
        role: roleCode,
        roleId: data.roleId,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    // Manual explicit store assignment takes priority
    if (data.storeId && (roleCode === 'SM')) {
      await this.assignSMToStore(user.id, data.storeId);
    } else if (data.storeIds?.length && (roleCode === 'AM')) {
      await this.assignAMToStores(user.id, data.storeIds);
    } else {
      // Fallback: auto-match by name/email convention
      await this.assignUserToStoresByConvention(user);
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, fullName: true, phone: true, role: true, isActive: true,
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
    if (user.role === 'AM') {
      await this.prisma.store.updateMany({
        where: { amName: user.fullName },
        data: { amId: user.id }
      });
    } else if (user.role === 'SM') {
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
    
    // Sync roleId to role string
    if (updateData.roleId) {
      const dbRole = await this.prisma.role.findUnique({ where: { id: updateData.roleId } });
      if (dbRole) updateData.role = dbRole.code;
    }
    
    // Map fullName to fullName for Prisma
    if (updateData.fullName) {
      updateData.fullName = updateData.fullName;
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

    if (storeId !== undefined && (role === 'SM')) {
      if (storeId) {
        await this.assignSMToStore(id, storeId);
      } else {
        // Unassign
        await this.prisma.store.updateMany({ where: { smId: id }, data: { smId: null } });
      }
    } else if (storeIds !== undefined && (role === 'AM')) {
      await this.assignAMToStores(id, storeIds);
    }

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, phone: true, role: true, isActive: true,
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
            fullName: user.fullName || existing.fullName,
            phone: user.phone,
            role: user.role || existing.role,
            isActive: user.isActive !== undefined ? user.isActive : existing.isActive,
          };
          // Hash new password if provided
          if (user.password) {
            updateData.password = await bcrypt.hash(user.password, SALT_ROUNDS);
          }
          
          const updatedUser = await this.prisma.user.update({
            where: { id: existing.id },
            data: updateData
          });

          // Handle store assignment if storeCode provided
          if (user.storeCode) {
            await this.assignToStoreByCode(updatedUser.id, user.storeCode, updatedUser.role);
          }
        } else {
          const newUser = await this.prisma.user.create({
            data: {
              email: user.email,
              password: await bcrypt.hash(user.password || 'kfc@123', SALT_ROUNDS),
              fullName: user.fullName,
              phone: user.phone,
              role: user.role || 'SM',
              isActive: user.isActive !== undefined ? user.isActive : true,
            }
          });
          
          if (user.storeCode) {
            await this.assignToStoreByCode(newUser.id, user.storeCode, newUser.role);
          } else {
            await this.assignUserToStoresByConvention(newUser);
          }
        }
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Lỗi import ${user.email || 'unknown'}: ${error.message}`);
      }
    }

    return results;
  }

  private async assignToStoreByCode(userId: string, storeCode: string, role: string) {
    const store = await this.prisma.store.findFirst({
      where: { OR: [{ id: storeCode }, { code: storeCode }] }
    });
    
    if (!store) return;

    if (role === 'SM') {
      await this.assignSMToStore(userId, store.id);
    } else if (role === 'AM') {
      // For AM, we add to their list (or just this one if it's a simple import)
      await this.prisma.store.update({
        where: { id: store.id },
        data: { amId: userId }
      });
    }
  }

  async exportUsers() {
    const users = await this.findAll();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nhân viên');

    worksheet.columns = [
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Họ tên', key: 'fullName', width: 25 },
      { header: 'Số điện thoại', key: 'phone', width: 15 },
      { header: 'Vai trò', key: 'role', width: 15 },
      { header: 'Trạng thái', key: 'isActive', width: 15 },
      { header: 'Cửa hàng quản lý', key: 'managedStore', width: 30 },
      { header: 'Ngày tạo', key: 'createdAt', width: 20 },
    ];

    users.forEach(user => {
      worksheet.addRow({
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive ? 'Hoạt động' : 'Khóa',
        managedStore: user.managedStore ? `${user.managedStore.code} - ${user.managedStore.name}` : (user.managedStores?.length ? user.managedStores.map(s => s.code).join(', ') : ''),
        createdAt: user.createdAt,
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    return workbook;
  }

  async importUsersFromFile(file: Express.Multer.File) {
    try {
      const rows = await readXlsxFile(file.buffer);
      if (rows.length < 2) {
        throw new Error('File không có dữ liệu');
      }

      // Skip header row
      const header = rows[0] as any[];
      const dataRows = rows.slice(1);

      const findIdx = (keywords: string[]) => 
        header.findIndex(h => h && keywords.some(k => String(h).toLowerCase().includes(k.toLowerCase())));

      const emailIdx = findIdx(['email']);
      const nameIdx = findIdx(['tên', 'name', 'họ tên', 'full name']);
      const phoneIdx = findIdx(['thoại', 'phone', 'sđt', 'liên hệ']);
      const roleIdx = findIdx(['trò', 'role', 'quyền', 'chức vụ']);
      const statusIdx = findIdx(['thái', 'status', 'trạng thái', 'active']);
      const passwordIdx = findIdx(['mật khẩu', 'password', 'pass']);
      const storeIdx = findIdx(['cửa hàng', 'store', 'mã ch']);

      if (emailIdx === -1) {
        throw new Error('Không tìm thấy cột Email trong file');
      }

      const roleMap: Record<string, string> = { 
        'user': 'SM', 'ta': 'SM', 'sm': 'SM', 
        'am': 'AM', 'manager': 'AM',
        'admin': 'ADMIN', 'quản trị': 'ADMIN',
        'recruiter': 'RECRUITER', 'tuyển dụng': 'RECRUITER'
      };

      const users = dataRows.map((row, idx) => {
        const email = row[emailIdx] ? String(row[emailIdx]).trim() : null;
        if (!email) return null;

        const rawRole = roleIdx !== -1 && row[roleIdx] ? String(row[roleIdx]).toLowerCase() : 'sm';
        let role = 'SM';
        for (const [key, value] of Object.entries(roleMap)) {
          if (rawRole.includes(key)) {
            role = value;
            break;
          }
        }

        const rawStatus = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).toLowerCase() : 'hoạt động';
        const isActive = rawStatus.includes('hoạt động') || rawStatus === 'true' || rawStatus === '1' || rawStatus === 'active';

        // Extract store code/id if provided
        let storeIdOrCode = storeIdx !== -1 && row[storeIdx] ? String(row[storeIdx]).trim() : null;
        // If it's something like "S001 - KFC Example", take the code
        if (storeIdOrCode && storeIdOrCode.includes(' - ')) {
          storeIdOrCode = storeIdOrCode.split(' - ')[0];
        }

        return {
          email,
          fullName: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : email.split('@')[0],
          phone: phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : null,
          role,
          isActive,
          password: passwordIdx !== -1 && row[passwordIdx] ? String(row[passwordIdx]) : undefined,
          storeCode: storeIdOrCode
        };
      }).filter(u => u !== null);

      return this.importUsers({ users });
    } catch (error: any) {
      throw new Error(`Lỗi xử lý file: ${error.message}`);
    }
  }
}
