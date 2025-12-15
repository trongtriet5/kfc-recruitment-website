import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { startOfMonth } from 'date-fns';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ConvertCandidateToEmployeeDto } from './dto/convert-candidate-to-employee.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  private async getTypeIdByCode(categoryCode: string, typeCode: string): Promise<string | null> {
    const category = await this.prisma.typeCategory.findUnique({
      where: { code: categoryCode },
    });
    if (!category) return null;

    const type = await this.prisma.type.findUnique({
      where: {
        categoryId_code: {
          categoryId: category.id,
          code: typeCode,
        },
      },
    });
    return type?.id || null;
  }

  async generateEmployeeCode(): Promise<string> {
    // Get the latest employee code
    const latestEmployee = await this.prisma.employee.findFirst({
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });

    if (!latestEmployee) {
      return 'EMP001';
    }

    // Extract number from code (e.g., "EMP001" -> 1)
    const match = latestEmployee.employeeCode.match(/EMP(\d+)/);
    if (match) {
      const nextNumber = parseInt(match[1], 10) + 1;
      return `EMP${nextNumber.toString().padStart(3, '0')}`;
    }

    // If format doesn't match, start from 1
    return 'EMP001';
  }

  async findAll(user: User, filters?: any) {
    const where: any = {};
    if (filters?.statusId) where.statusId = filters.statusId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.positionId) where.positionId = filters.positionId;
    if (filters?.storeId) where.storeId = filters.storeId;

    return this.prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        store: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        contracts: {
          where: { 
            status: {
              code: 'ACTIVE',
              category: { code: 'CONTRACT_STATUS' },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: User) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        status: true,
        contractType: true,
        department: true,
        position: true,
        store: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        contracts: {
          include: {
            type: true,
            status: true,
          },
          orderBy: { startDate: 'desc' },
        },
        decisions: {
          include: {
            type: true,
            status: true,
          },
          orderBy: { effectiveDate: 'desc' },
        },
        requests: {
          include: {
            type: true,
            status: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async create(createDto: CreateEmployeeDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can create employees');
    }

    const employeeData: any = {
      ...createDto,
      dateOfBirth: createDto.dateOfBirth ? new Date(createDto.dateOfBirth) : null,
      startDate: createDto.startDate ? new Date(createDto.startDate) : null,
      endDate: createDto.endDate ? new Date(createDto.endDate) : null,
    };

    return this.prisma.employee.create({
      data: employeeData,
      include: {
        department: true,
        position: true,
        store: true,
      },
    });
  }

  async update(id: string, updateDto: UpdateEmployeeDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can update employees');
    }

    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updateData: any = { ...updateDto };
    if (updateDto.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateDto.dateOfBirth);
    }
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    return this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        position: true,
        store: true,
      },
    });
  }

  async getDashboard(user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException();
    }

    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get Type IDs
    const [
      workingStatusId,
      resignedStatusId,
      activeContractStatusId,
    ] = await Promise.all([
      this.getTypeIdByCode('EMPLOYEE_STATUS', 'WORKING'),
      this.getTypeIdByCode('EMPLOYEE_STATUS', 'RESIGNED'),
      this.getTypeIdByCode('CONTRACT_STATUS', 'ACTIVE'),
    ]);

    const [
      totalEmployees,
      byGender,
      working,
      newEmployees,
      resigned,
      byDepartment,
      byPosition,
      byContractType,
      byEducation,
      newContracts,
      expiringContracts,
      insuranceDecreased,
      insuranceIncreased,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.groupBy({
        by: ['gender'],
        _count: true,
      }),
      this.prisma.employee.count({
        where: { status: { id: workingStatusId! } },
      }),
      this.prisma.employee.count({
        where: {
          createdAt: { gte: startOfThisMonth },
        },
      }),
      this.prisma.employee.count({
        where: { status: { id: resignedStatusId! } },
      }),
      this.prisma.employee.groupBy({
        by: ['departmentId'],
        _count: true,
      }),
      this.prisma.employee.groupBy({
        by: ['positionId'],
        _count: true,
      }),
      this.prisma.employee.groupBy({
        by: ['contractTypeId'],
        _count: true,
      }),
      this.prisma.employee.groupBy({
        by: ['education'],
        _count: true,
      }),
      this.prisma.contract.count({
        where: {
          createdAt: { gte: startOfThisMonth },
        },
      }),
      this.prisma.contract.count({
        where: {
          status: { id: activeContractStatusId! },
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
      this.prisma.employee.count({
        where: {
          status: { id: resignedStatusId! },
          updatedAt: { gte: startOfThisMonth },
          insuranceNumber: { not: null },
        },
      }),
      this.prisma.employee.count({
        where: {
          status: { id: workingStatusId! },
          createdAt: { gte: startOfThisMonth },
          insuranceNumber: { not: null },
        },
      }),
    ]);

    const departments = await this.prisma.department.findMany({
      where: {
        id: { in: byDepartment.map((d) => d.departmentId).filter(Boolean) },
      },
    });
    const positions = await this.prisma.position.findMany({
      where: {
        id: { in: byPosition.map((p) => p.positionId).filter(Boolean) },
      },
    });

    return {
      totalEmployees,
      byGender: byGender.map((g) => ({
        gender: g.gender,
        count: g._count,
      })),
      working,
      newEmployees,
      resigned,
      byDepartment: byDepartment.map((d) => ({
        departmentId: d.departmentId,
        department: departments.find((dept) => dept.id === d.departmentId),
        count: d._count,
      })),
      byPosition: byPosition.map((p) => ({
        positionId: p.positionId,
        position: positions.find((pos) => pos.id === p.positionId),
        count: p._count,
      })),
      byContractType: byContractType.map((c) => ({
        contractTypeId: c.contractTypeId,
        count: c._count,
      })),
      byEducation: byEducation.map((e) => ({
        education: e.education,
        count: e._count,
      })),
      newContracts,
      expiringContracts,
      insuranceDecreased,
      insuranceIncreased,
    };
  }

  async convertCandidateToEmployee(convertDto: ConvertCandidateToEmployeeDto, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException('Only ADMIN and HR can convert candidates to employees');
    }

    // Verify candidate exists and has ONBOARDING_ACCEPTED status
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: convertDto.candidateId },
      include: {
        status: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const statusCode = typeof candidate.status === 'object' ? candidate.status.code : candidate.status;
    if (statusCode !== 'ONBOARDING_ACCEPTED') {
      throw new BadRequestException('Candidate must have ONBOARDING_ACCEPTED status to be converted to employee');
    }

    // Check if employee code already exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { employeeCode: convertDto.employeeCode },
    });
    if (existingEmployee) {
      throw new BadRequestException('Employee code already exists');
    }

    // Check if email already exists (if candidate has email)
    if (candidate.email) {
      const existingEmail = await this.prisma.employee.findUnique({
        where: { email: candidate.email },
      });
      if (existingEmail) {
        throw new BadRequestException('Email already exists for another employee');
      }
    }

    // Check if idCard (CCCD) already exists (if candidate has cccd)
    if (candidate.cccd) {
      const existingIdCard = await this.prisma.employee.findUnique({
        where: { idCard: candidate.cccd },
      });
      if (existingIdCard) {
        throw new BadRequestException('ID Card (CCCD) already exists for another employee');
      }
    }

    // Build address from candidate's address fields or use provided address
    let address = convertDto.address;
    if (!address && candidate.currentCity) {
      const addressParts = [
        candidate.currentStreet,
        candidate.currentWard,
        candidate.currentDistrict,
        candidate.currentCity,
      ].filter(Boolean);
      address = addressParts.join(', ') || null;
    }

    // Get default status if not provided
    let statusId = convertDto.statusId;
    if (!statusId) {
      statusId = await this.getTypeIdByCode('EMPLOYEE_STATUS', 'WORKING');
    }

    // Create employee from candidate data
    const employee = await this.prisma.employee.create({
      data: {
        employeeCode: convertDto.employeeCode,
        fullName: candidate.fullName,
        email: candidate.email || null,
        phone: candidate.phone,
        gender: candidate.gender || 'OTHER', // Default to OTHER if not set
        dateOfBirth: candidate.dateOfBirth || null,
        address: address,
        idCard: candidate.cccd || null,
        education: convertDto.education,
        statusId: statusId,
        departmentId: convertDto.departmentId || null,
        positionId: convertDto.positionId || null,
        storeId: convertDto.storeId || candidate.storeId || null,
        brand: convertDto.brand || candidate.brand || null,
        contractTypeId: convertDto.contractTypeId || null,
        startDate: convertDto.startDate ? new Date(convertDto.startDate) : null,
        endDate: convertDto.endDate ? new Date(convertDto.endDate) : null,
        salary: convertDto.salary ? convertDto.salary : null,
        insuranceNumber: convertDto.insuranceNumber || null,
      },
      include: {
        department: true,
        position: true,
        store: true,
        status: true,
      },
    });

    return employee;
  }
}
