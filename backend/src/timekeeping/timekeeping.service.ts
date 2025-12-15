import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class TimekeepingService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: User, filters?: any) {
    const where: any = {};

    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT') {
      if (user.employeeId) {
        where.employeeId = user.employeeId;
      } else {
        return [];
      }
    } else if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters?.month && filters?.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 0);
      where.date = { gte: start, lte: end };
    } else if (filters?.startDate && filters?.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return this.prisma.timekeeping.findMany({
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
      },
      orderBy: { date: 'desc' },
    });
  }

  async checkInOut(
    user: User,
    type: 'CHECKIN' | 'CHECKOUT',
    lat: number,
    lng: number,
    date?: string,
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException('Employee profile required');
    }

    const checkDate = date ? new Date(date) : new Date();
    checkDate.setHours(0, 0, 0, 0);

    let timekeeping = await this.prisma.timekeeping.findUnique({
      where: {
        employeeId_date: {
          employeeId: user.employeeId,
          date: checkDate,
        },
      },
    });

    const now = new Date();
    const updateData: any = {
      userId: user.id,
    };

    if (type === 'CHECKIN') {
      updateData.checkInTime = now;
      updateData.checkInLat = lat;
      updateData.checkInLng = lng;
    } else if (type === 'CHECKOUT') {
      updateData.checkOutTime = now;
      updateData.checkOutLat = lat;
      updateData.checkOutLng = lng;

      if (timekeeping?.checkInTime) {
        const workMs = now.getTime() - timekeeping.checkInTime.getTime();
        updateData.workHours = workMs / (1000 * 60 * 60);
      }
    }

    if (timekeeping) {
      timekeeping = await this.prisma.timekeeping.update({
        where: { id: timekeeping.id },
        data: updateData,
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
        },
      });
    } else {
      timekeeping = await this.prisma.timekeeping.create({
        data: {
          employeeId: user.employeeId,
          date: checkDate,
          ...updateData,
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
        },
      });
    }

    return timekeeping;
  }
}

