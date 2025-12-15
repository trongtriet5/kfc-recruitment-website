import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';

@Injectable()
export class DecisionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: User, filters?: any) {
    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.type) {
      // If type is a code, find the type ID
      const typeType = await this.prisma.type.findFirst({
        where: {
          code: filters.type,
          category: { code: 'DECISION_TYPE' },
        },
      });
      if (typeType) {
        where.typeId = typeType.id;
      }
    } else if (filters?.typeId) {
      where.typeId = filters.typeId;
    }
    if (filters?.status) {
      // If status is a code, find the type ID
      const statusType = await this.prisma.type.findFirst({
        where: {
          code: filters.status,
          category: { code: 'DECISION_STATUS' },
        },
      });
      if (statusType) {
        where.statusId = statusType.id;
      }
    } else if (filters?.statusId) {
      where.statusId = filters.statusId;
    }

    return this.prisma.decision.findMany({
      where,
      include: {
        type: true,
        status: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: User) {
    const decision = await this.prisma.decision.findUnique({
      where: { id },
      include: {
        type: true,
        status: true,
        employee: {
          include: {
            department: true,
            position: true,
            store: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!decision) {
      throw new NotFoundException('Decision not found');
    }

    return decision;
  }

  async create(createDto: CreateDecisionDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can create decisions');
    }

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: createDto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get default status (ACTIVE) if not provided
    const activeStatus = await this.prisma.type.findFirst({
      where: {
        code: 'ACTIVE',
        category: { code: 'DECISION_STATUS' },
      },
    });

    return this.prisma.decision.create({
      data: {
        employeeId: createDto.employeeId,
        typeId: createDto.typeId,
        title: createDto.title,
        content: createDto.content,
        effectiveDate: new Date(createDto.effectiveDate),
        fileUrl: createDto.fileUrl,
        statusId: activeStatus?.id || null,
        createdById: user.id,
      },
      include: {
        type: true,
        status: true,
        employee: true,
        createdBy: true,
      },
    });
  }

  async update(id: string, updateDto: UpdateDecisionDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can update decisions');
    }

    const decision = await this.prisma.decision.findUnique({ where: { id } });
    if (!decision) {
      throw new NotFoundException('Decision not found');
    }

    return this.prisma.decision.update({
      where: { id },
      data: updateDto,
      include: {
        type: true,
        status: true,
        employee: true,
        createdBy: true,
      },
    });
  }
}
