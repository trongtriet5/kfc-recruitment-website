import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class PayrollService {
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

  async findAll(user: User, filters?: any) {
    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.month) where.month = filters.month;
    if (filters?.year) where.year = filters.year;
    if (filters?.status) where.status = filters.status;

    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      if (user.employeeId) {
        where.employeeId = user.employeeId;
      } else {
        return [];
      }
    }

    return this.prisma.payroll.findMany({
      where,
      include: {
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
        department: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async calculate(employeeId: string, month: number, year: number, user: User) {
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      throw new ForbiddenException();
    }

    const existing = await this.prisma.payroll.findFirst({
      where: {
        employeeId,
        month,
        year,
      },
    });

    if (existing) {
      throw new BadRequestException('Payroll already exists for this period');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });

    if (!employee || !employee.salary) {
      throw new BadRequestException('Employee not found or salary not set');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const timekeeping = await this.prisma.timekeeping.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const workDays = timekeeping.filter((t) => t.workHours && t.workHours > 0).length;
    const workHours = timekeeping.reduce((sum, t) => sum + (t.workHours || 0), 0);
    const overtimeHours = timekeeping.reduce(
      (sum, t) => sum + (t.overtimeHours || 0),
      0,
    );

    const baseSalary = employee.salary;
    const hourlyRate = Number(baseSalary) / (22 * 8);
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const allowances = 0;
    const deductions = 0;
    const grossSalary =
      Number(baseSalary) + Number(overtimePay) + Number(allowances) - Number(deductions);
    const tax = grossSalary > 11000000 ? (grossSalary - 11000000) * 0.1 : 0;
    const insurance = Number(baseSalary) * 0.105;
    const netSalary = grossSalary - tax - insurance;

    return this.prisma.payroll.create({
      data: {
        employeeId,
        userId: user.id,
        month,
        year,
        baseSalary,
        workDays,
        workHours,
        overtimeHours,
        overtimePay,
        allowances,
        deductions,
        grossSalary,
        tax,
        insurance,
        netSalary,
        departmentId: employee.departmentId,
        statusId: (await this.getTypeIdByCode('PAYROLL_STATUS', 'CALCULATED'))!,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: true,
            position: true,
          },
        },
        department: true,
      },
    });
  }
}

