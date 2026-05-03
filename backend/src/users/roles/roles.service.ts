
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS, ROLE_LABELS } from '../../recruitment/constraints';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(data: { name: string; code: string; description?: string; permissions: string[] }) {
    const existing = await this.prisma.role.findUnique({
      where: { code: data.code },
    });
    if (existing) throw new BadRequestException('Role code already exists');

    return this.prisma.role.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        permissions: data.permissions,
        isSystem: false,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string; permissions?: string[]; isActive?: boolean }) {
    const role = await this.findOne(id);
    
    // System roles can only have permissions and description updated, not code/name maybe?
    // Actually, let's allow updating name/description but be careful with system roles.
    
    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException('Cannot delete system roles');

    const usersCount = await this.prisma.user.count({
      where: { roleId: id },
    });
    if (usersCount > 0) throw new BadRequestException('Cannot delete role with assigned users');

    return this.prisma.role.delete({
      where: { id },
    });
  }

  async getAllPermissionMetadata() {
    // Return all available permission codes for the UI
    // We can extract these from the PERMISSIONS object or define a master list
    const allPermissions = new Set<string>();
    Object.values(PERMISSIONS).forEach(perms => {
      perms.forEach(p => allPermissions.add(p));
    });

    return Array.from(allPermissions).sort();
  }
}
