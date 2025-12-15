import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: User, filters?: any) {
    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.status) {
      // If status is a code, find the type ID
      const statusType = await this.prisma.type.findFirst({
        where: {
          code: filters.status,
          category: { code: 'CONTRACT_STATUS' },
        },
      });
      if (statusType) {
        where.statusId = statusType.id;
      }
    }

    return this.prisma.contract.findMany({
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
    const contract = await this.prisma.contract.findUnique({
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

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async create(createDto: CreateContractDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can create contracts');
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
        category: { code: 'CONTRACT_STATUS' },
      },
    });

    return this.prisma.contract.create({
      data: {
        employeeId: createDto.employeeId,
        typeId: createDto.typeId,
        startDate: new Date(createDto.startDate),
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
        salary: createDto.salary,
        position: createDto.position,
        department: createDto.department,
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

  async update(id: string, updateDto: UpdateContractDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can update contracts');
    }

    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const updateData: any = { ...updateDto };
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    return this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        type: true,
        status: true,
        employee: true,
        createdBy: true,
      },
    });
  }
}
