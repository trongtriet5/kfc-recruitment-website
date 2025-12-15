import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateTypeCategoryDto } from './dto/create-type-category.dto';
import { CreateTypeDto } from './dto/create-type.dto';

@Injectable()
export class TypesService {
  constructor(private prisma: PrismaService) {}

  // ============ Type Categories ============
  async createCategory(createDto: CreateTypeCategoryDto, user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can create type categories');
    }

    // Check if code already exists
    const existing = await this.prisma.typeCategory.findUnique({
      where: { code: createDto.code },
    });
    if (existing) {
      throw new BadRequestException('Category code already exists');
    }

    return this.prisma.typeCategory.create({
      data: createDto,
    });
  }

  async getCategories(user: User, filters?: { module?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.module) where.module = filters.module;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.typeCategory.findMany({
      where,
      include: {
        types: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { types: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCategory(id: string, user: User) {
    const category = await this.prisma.typeCategory.findUnique({
      where: { id },
      include: {
        types: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, updateDto: Partial<CreateTypeCategoryDto>, user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can update type categories');
    }

    const category = await this.prisma.typeCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.typeCategory.update({
      where: { id },
      data: updateDto,
    });
  }

  async deleteCategory(id: string, user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can delete type categories');
    }

    const category = await this.prisma.typeCategory.findUnique({
      where: { id },
      include: { types: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.types.length > 0) {
      throw new BadRequestException('Cannot delete category with existing types');
    }

    return this.prisma.typeCategory.delete({ where: { id } });
  }

  // ============ Types ============
  async createType(createDto: CreateTypeDto, user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can create types');
    }

    // Verify category exists
    const category = await this.prisma.typeCategory.findUnique({
      where: { id: createDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if code already exists in category
    const existing = await this.prisma.type.findUnique({
      where: {
        categoryId_code: {
          categoryId: createDto.categoryId,
          code: createDto.code,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Type code already exists in this category');
    }

    // If this is set as default, unset other defaults in the category
    if (createDto.isDefault) {
      await this.prisma.type.updateMany({
        where: { categoryId: createDto.categoryId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.type.create({
      data: createDto,
      include: {
        category: true,
      },
    });
  }

  async getTypes(user: User, filters?: { categoryId?: string; module?: string; isActive?: boolean }) {
    const where: any = {};
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.module) {
      where.category = { module: filters.module };
    }

    return this.prisma.type.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ category: { name: 'asc' } }, { order: 'asc' }],
    });
  }

  async getType(id: string, user: User) {
    const type = await this.prisma.type.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!type) {
      throw new NotFoundException('Type not found');
    }

    return type;
  }

  async updateType(id: string, updateDto: Partial<CreateTypeDto>, user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can update types');
    }

    const type = await this.prisma.type.findUnique({ where: { id } });
    if (!type) {
      throw new NotFoundException('Type not found');
    }

    // If setting as default, unset other defaults
    if (updateDto.isDefault === true) {
      await this.prisma.type.updateMany({
        where: { categoryId: type.categoryId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.type.update({
      where: { id },
      data: updateDto,
      include: {
        category: true,
      },
    });
  }

  async deleteType(id: string, user: User) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can delete types');
    }

    const type = await this.prisma.type.findUnique({ where: { id } });
    if (!type) {
      throw new NotFoundException('Type not found');
    }

    // Check if type is being used (this is a simplified check)
    // In production, you might want to check all related tables
    const isUsed = await this.checkTypeUsage(id);
    if (isUsed) {
      throw new BadRequestException('Cannot delete type that is in use');
    }

    return this.prisma.type.delete({ where: { id } });
  }

  private async checkTypeUsage(typeId: string): Promise<boolean> {
    // Check all tables that might use this type
    const [employees, requests, contracts, decisions, candidates, interviews, proposals, timekeeping, payrolls] =
      await Promise.all([
        this.prisma.employee.count({ 
          where: { 
            OR: [
              { status: { id: typeId } }, 
              { contractType: { id: typeId } }
            ] 
          } 
        }),
        this.prisma.request.count({ 
          where: { 
            OR: [
              { type: { id: typeId } }, 
              { status: { id: typeId } }, 
              { leaveType: { id: typeId } }
            ] 
          } 
        }),
        this.prisma.contract.count({ 
          where: { 
            OR: [
              { type: { id: typeId } }, 
              { status: { id: typeId } }
            ] 
          } 
        }),
        this.prisma.decision.count({ 
          where: { 
            OR: [
              { type: { id: typeId } }, 
              { status: { id: typeId } }
            ] 
          } 
        }),
        this.prisma.candidate.count({ where: { status: { id: typeId } } }),
        this.prisma.interview.count({ 
          where: { 
            OR: [
              { type: { id: typeId } }, 
              { result: { id: typeId } }
            ] 
          } 
        }),
        this.prisma.recruitmentProposal.count({ where: { status: { id: typeId } } }),
        this.prisma.timekeeping.count({ where: { status: { id: typeId } } }),
        this.prisma.payroll.count({ where: { status: { id: typeId } } }),
      ]);

    return (
      employees > 0 ||
      requests > 0 ||
      contracts > 0 ||
      decisions > 0 ||
      candidates > 0 ||
      interviews > 0 ||
      proposals > 0 ||
      timekeeping > 0 ||
      payrolls > 0
    );
  }

  // Helper method to get types by category code
  async getTypesByCategoryCode(categoryCode: string, user: User) {
    const category = await this.prisma.typeCategory.findUnique({
      where: { code: categoryCode },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.type.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  }
}

