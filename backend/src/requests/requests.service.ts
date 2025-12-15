import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { User } from '@prisma/client';

@Injectable()
export class RequestsService {
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

  async create(createRequestDto: CreateRequestDto, user: User) {
    if (!user.employeeId) {
      throw new ForbiddenException('Employee profile required');
    }

    // Get request type to determine type-specific fields
    const requestType = await this.prisma.type.findUnique({
      where: { id: createRequestDto.typeId },
    });

    if (!requestType) {
      throw new NotFoundException('Request type not found');
    }

    const requestData: any = {
      typeId: createRequestDto.typeId,
      employeeId: user.employeeId,
      departmentId: user.departmentId,
      startDate: createRequestDto.startDate
        ? new Date(createRequestDto.startDate)
        : null,
      endDate: createRequestDto.endDate
        ? new Date(createRequestDto.endDate)
        : null,
      reason: createRequestDto.reason,
      description: createRequestDto.description,
    };

    // Type-specific fields based on type code
    if (requestType.code === 'LEAVE') {
      requestData.leaveTypeId = createRequestDto.leaveTypeId;
    } else if (requestType.code === 'OVERTIME') {
      requestData.overtimeHours = createRequestDto.overtimeHours;
      requestData.overtimeDate = createRequestDto.overtimeDate
        ? new Date(createRequestDto.overtimeDate)
        : null;
    } else if (requestType.code === 'CHECKIN_CONFIRMATION') {
      requestData.checkInTime = createRequestDto.checkInTime
        ? new Date(createRequestDto.checkInTime)
        : null;
      requestData.checkOutTime = createRequestDto.checkOutTime
        ? new Date(createRequestDto.checkOutTime)
        : null;
    } else if (requestType.code === 'SHIFT_CHANGE') {
      requestData.fromShift = createRequestDto.fromShift;
      requestData.toShift = createRequestDto.toShift;
      requestData.shiftDate = createRequestDto.shiftDate
        ? new Date(createRequestDto.shiftDate)
        : null;
    } else if (requestType.code === 'BUSINESS_TRIP') {
      requestData.tripLocation = createRequestDto.tripLocation;
      requestData.tripPurpose = createRequestDto.tripPurpose;
    }

    // Set default status to PENDING (always set automatically, never from client)
    const pendingStatusId = await this.getTypeIdByCode('REQUEST_STATUS', 'PENDING');
    if (pendingStatusId) {
      requestData.statusId = pendingStatusId;
    }

    return this.prisma.request.create({
      data: requestData,
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

  async findAll(user: User, filters?: any) {
    const where: any = {};

    if (filters?.typeId) where.typeId = filters.typeId;
    if (filters?.statusId) where.statusId = filters.statusId;
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    // If user is not admin/HR/Manager, only show their own requests
    // MANAGER and SUPERVISOR can see requests from their department
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT' && user.role !== 'MANAGER' && user.role !== 'SUPERVISOR') {
      if (user.employeeId) {
        where.employeeId = user.employeeId;
      } else {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };
      }
    } else if (user.role === 'MANAGER' || user.role === 'SUPERVISOR') {
      // Manager and Supervisor can see requests from their department
      if (user.departmentId) {
        where.departmentId = user.departmentId;
      }
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.request.count({ where });

    // Get paginated data
    const data = await this.prisma.request.findMany({
      where,
      include: {
        type: true,
        status: true,
        leaveType: true,
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
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        type: true,
        status: true,
        leaveType: true,
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        department: true,
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check permission
    // ADMIN, HEAD_OF_DEPARTMENT, MANAGER, SUPERVISOR can view all requests
    // Others can only view their own requests
    if (
      user.role !== 'ADMIN' &&
      user.role !== 'HEAD_OF_DEPARTMENT' &&
      user.role !== 'MANAGER' &&
      user.role !== 'SUPERVISOR' &&
      request.employeeId !== user.employeeId
    ) {
      throw new ForbiddenException();
    }
    
    // MANAGER and SUPERVISOR can only view requests from their department
    if ((user.role === 'MANAGER' || user.role === 'SUPERVISOR') && user.departmentId) {
      if (request.departmentId !== user.departmentId) {
        throw new ForbiddenException();
      }
    }

    return request;
  }

  async update(id: string, updateRequestDto: UpdateRequestDto, user: User) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check if user is the creator of the request
    const isCreator = request.employeeId === user.employeeId;
    const isAdminOrHR = user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT' || user.role === 'MANAGER' || user.role === 'SUPERVISOR';
    const isPending = request.status?.code === 'PENDING';
    
    // Check department permission for MANAGER and SUPERVISOR
    if ((user.role === 'MANAGER' || user.role === 'SUPERVISOR') && user.departmentId) {
      if (request.departmentId !== user.departmentId) {
        throw new ForbiddenException('You can only manage requests from your department');
      }
    }

    // If updating status (approve/reject), only admin/HR/Manager can do it
    if (updateRequestDto.statusId) {
      if (!isAdminOrHR) {
        throw new ForbiddenException('Only ADMIN, HR, or MANAGER can approve/reject requests');
      }
    } else {
      // If updating other fields, only creator can do it when status is PENDING
      if (!isCreator) {
        throw new ForbiddenException('You can only update your own requests');
      }
      if (!isPending) {
        throw new ForbiddenException('You can only update requests with PENDING status');
      }
    }

    const updateData: any = {};

    // Status update (approve/reject)
    if (updateRequestDto.statusId) {
      updateData.statusId = updateRequestDto.statusId;
      updateData.approverId = user.id;
      
      // Get status type to check if it's APPROVED or REJECTED
      const statusType = await this.prisma.type.findUnique({
        where: { id: updateRequestDto.statusId },
      });
      
      if (statusType?.code === 'APPROVED') {
        updateData.approvedAt = new Date();
      } else if (statusType?.code === 'REJECTED') {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = updateRequestDto.rejectionReason;
      }
    } else {
      // Field updates (only for creator when PENDING)
      if (updateRequestDto.startDate !== undefined) {
        updateData.startDate = updateRequestDto.startDate ? new Date(updateRequestDto.startDate) : null;
      }
      if (updateRequestDto.endDate !== undefined) {
        updateData.endDate = updateRequestDto.endDate ? new Date(updateRequestDto.endDate) : null;
      }
      if (updateRequestDto.reason !== undefined) {
        updateData.reason = updateRequestDto.reason;
      }
      if (updateRequestDto.description !== undefined) {
        updateData.description = updateRequestDto.description;
      }
      if (updateRequestDto.leaveTypeId !== undefined) {
        updateData.leaveTypeId = updateRequestDto.leaveTypeId;
      }
      if (updateRequestDto.leaveDays !== undefined) {
        updateData.leaveDays = updateRequestDto.leaveDays;
      }
      if (updateRequestDto.overtimeHours !== undefined) {
        updateData.overtimeHours = updateRequestDto.overtimeHours;
      }
      if (updateRequestDto.overtimeDate !== undefined) {
        updateData.overtimeDate = updateRequestDto.overtimeDate ? new Date(updateRequestDto.overtimeDate) : null;
      }
      if (updateRequestDto.checkInTime !== undefined) {
        updateData.checkInTime = updateRequestDto.checkInTime ? new Date(updateRequestDto.checkInTime) : null;
      }
      if (updateRequestDto.checkOutTime !== undefined) {
        updateData.checkOutTime = updateRequestDto.checkOutTime ? new Date(updateRequestDto.checkOutTime) : null;
      }
      if (updateRequestDto.fromShift !== undefined) {
        updateData.fromShift = updateRequestDto.fromShift;
      }
      if (updateRequestDto.toShift !== undefined) {
        updateData.toShift = updateRequestDto.toShift;
      }
      if (updateRequestDto.shiftDate !== undefined) {
        updateData.shiftDate = updateRequestDto.shiftDate ? new Date(updateRequestDto.shiftDate) : null;
      }
      if (updateRequestDto.tripLocation !== undefined) {
        updateData.tripLocation = updateRequestDto.tripLocation;
      }
      if (updateRequestDto.tripPurpose !== undefined) {
        updateData.tripPurpose = updateRequestDto.tripPurpose;
      }
    }

    return this.prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        type: true,
        status: true,
        leaveType: true,
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
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getDashboard(user: User, filters?: { month?: number; year?: number }) {
    // Only ADMIN, HEAD_OF_DEPARTMENT, and MANAGER can access dashboard
    if (user.role !== 'ADMIN' && user.role !== 'HEAD_OF_DEPARTMENT' && user.role !== 'MANAGER') {
      throw new ForbiddenException();
    }

    const now = new Date();
    const month = filters?.month || now.getMonth() + 1;
    const year = filters?.year || now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999); // Set to end of month

    // Get Type IDs for dashboard queries
    const [
      leaveTypeId,
      resignationTypeId,
      overtimeTypeId,
      absenceTypeId,
      businessTripTypeId,
      checkinConfirmationTypeId,
      approvedStatusId,
      paidLeaveTypeId,
      unpaidLeaveTypeId,
    ] = await Promise.all([
      this.getTypeIdByCode('REQUEST_TYPE', 'LEAVE'),
      this.getTypeIdByCode('REQUEST_TYPE', 'RESIGNATION'),
      this.getTypeIdByCode('REQUEST_TYPE', 'OVERTIME'),
      this.getTypeIdByCode('REQUEST_TYPE', 'ABSENCE'),
      this.getTypeIdByCode('REQUEST_TYPE', 'BUSINESS_TRIP'),
      this.getTypeIdByCode('REQUEST_TYPE', 'CHECKIN_CONFIRMATION'),
      this.getTypeIdByCode('REQUEST_STATUS', 'APPROVED'),
      this.getTypeIdByCode('LEAVE_TYPE', 'PAID_LEAVE'),
      this.getTypeIdByCode('LEAVE_TYPE', 'UNPAID_LEAVE'),
    ]);

    // Check if any required type IDs are missing
    if (!leaveTypeId || !approvedStatusId) {
      console.warn('Missing required type IDs for dashboard:', {
        leaveTypeId,
        approvedStatusId,
        paidLeaveTypeId,
        unpaidLeaveTypeId,
        overtimeTypeId,
        absenceTypeId,
        businessTripTypeId,
        checkinConfirmationTypeId,
        resignationTypeId,
      });
    }

    // Log for debugging
    console.log('Dashboard query params:', {
      month,
      year,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      leaveTypeId,
      approvedStatusId,
      paidLeaveTypeId,
      unpaidLeaveTypeId,
      overtimeTypeId,
      absenceTypeId,
      businessTripTypeId,
      checkinConfirmationTypeId,
      resignationTypeId,
    });
    
    // Debug: Count all requests in the month
    const allRequestsInMonth = await this.prisma.request.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    console.log(`Total requests created in ${month}/${year}: ${allRequestsInMonth}`);

    // Similar to the original dashboard logic
    // Only count if we have the required type IDs
    const [
      totalOnLeave,
      paidLeave,
      unpaidLeave,
      resigned,
      resignationReasons,
      leaveByDepartment,
      overtimeByDepartment,
      overtimeCount,
      absenceCount,
      businessTripCount,
      checkinCount,
    ] = await Promise.all([
      // Count distinct employees on leave (APPROVED) in the month
      leaveTypeId && approvedStatusId ? this.prisma.request.findMany({
        where: {
          typeId: leaveTypeId,
          statusId: approvedStatusId,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: null,
            },
            {
              startDate: null,
              endDate: { gte: startDate },
            },
          ],
        },
        select: { employeeId: true },
        distinct: ['employeeId'],
      }).then(requests => requests.length) : Promise.resolve(0),
      leaveTypeId && paidLeaveTypeId && approvedStatusId ? this.prisma.request.count({
        where: {
          typeId: leaveTypeId,
          leaveTypeId: paidLeaveTypeId,
          statusId: approvedStatusId,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: null,
            },
            {
              startDate: null,
              endDate: { gte: startDate },
            },
          ],
        },
      }) : Promise.resolve(0),
      leaveTypeId && unpaidLeaveTypeId && approvedStatusId ? this.prisma.request.count({
        where: {
          typeId: leaveTypeId,
          leaveTypeId: unpaidLeaveTypeId,
          statusId: approvedStatusId,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: null,
            },
            {
              startDate: null,
              endDate: { gte: startDate },
            },
          ],
        },
      }) : Promise.resolve(0),
      resignationTypeId && approvedStatusId ? this.prisma.request.count({
        where: {
          typeId: resignationTypeId,
          statusId: approvedStatusId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }) : Promise.resolve(0),
      resignationTypeId && approvedStatusId ? this.prisma.request.findMany({
        where: {
          typeId: resignationTypeId,
          statusId: approvedStatusId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { reason: true },
      }).then(requests => {
        // Group by reason manually
        const grouped: { [key: string]: number } = {};
        requests.forEach(req => {
          if (req.reason) {
            grouped[req.reason] = (grouped[req.reason] || 0) + 1;
          }
        });
        return Object.entries(grouped).map(([reason, count]) => ({ reason, _count: count }));
      }) : Promise.resolve([]),
      leaveTypeId && approvedStatusId ? this.prisma.request.findMany({
        where: {
          typeId: leaveTypeId,
          statusId: approvedStatusId,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: null,
            },
            {
              startDate: null,
              endDate: { gte: startDate },
            },
          ],
        },
        select: { departmentId: true },
      }).then(requests => {
        // Group by departmentId only
        const grouped: { [key: string]: number } = {};
        requests.forEach(req => {
          const key = req.departmentId || 'null';
          grouped[key] = (grouped[key] || 0) + 1;
        });
        return Object.entries(grouped).map(([departmentId, count]) => ({
          departmentId: departmentId === 'null' ? null : departmentId,
          _count: count,
        }));
      }) : Promise.resolve([]),
      overtimeTypeId && approvedStatusId ? this.prisma.request.findMany({
        where: {
          typeId: overtimeTypeId,
          statusId: approvedStatusId,
          overtimeDate: { gte: startDate, lte: endDate },
        },
        select: { departmentId: true, overtimeHours: true },
      }).then(requests => {
        // Group by departmentId manually
        const grouped: { [key: string]: { count: number; sum: number } } = {};
        requests.forEach(req => {
          const key = req.departmentId || 'null';
          if (!grouped[key]) {
            grouped[key] = { count: 0, sum: 0 };
          }
          grouped[key].count++;
          grouped[key].sum += req.overtimeHours || 0;
        });
        return Object.entries(grouped).map(([departmentId, data]) => ({
          departmentId: departmentId === 'null' ? null : departmentId,
          _sum: { overtimeHours: data.sum },
        }));
      }) : Promise.resolve([]),
      // Count APPROVED overtime requests for dashboard
      overtimeTypeId && approvedStatusId ? this.prisma.request.count({
        where: {
          typeId: overtimeTypeId,
          statusId: approvedStatusId,
          overtimeDate: { gte: startDate, lte: endDate },
        },
      }) : Promise.resolve(0),
      // Count APPROVED absence requests for dashboard
      absenceTypeId && approvedStatusId ? this.prisma.request.count({
        where: {
          typeId: absenceTypeId,
          statusId: approvedStatusId,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: null,
            },
            {
              startDate: null,
              endDate: { gte: startDate },
            },
          ],
        },
      }) : Promise.resolve(0),
      // Count APPROVED business trip requests for dashboard
      businessTripTypeId && approvedStatusId ? this.prisma.request.count({
        where: {
          typeId: businessTripTypeId,
          statusId: approvedStatusId,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: null,
            },
            {
              startDate: null,
              endDate: { gte: startDate },
            },
          ],
        },
      }) : Promise.resolve(0),
      // Count APPROVED checkin confirmation requests for dashboard
      checkinConfirmationTypeId && approvedStatusId ? this.prisma.request.count({
        where: {
          typeId: checkinConfirmationTypeId,
          statusId: approvedStatusId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }) : Promise.resolve(0),
    ]);

    // Get monthly data (last 6 months)
    const monthlyData: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const count = await this.prisma.request.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      monthlyData.push({
        month: `${date.getMonth() + 1}/${date.getFullYear()}`,
        count,
      });
    }

    // Get requests by type
    const requestsByType = await this.prisma.request.groupBy({
      by: ['typeId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    // Get type names
    const typeIds = requestsByType.map((r) => r.typeId).filter(Boolean);
    const types = await this.prisma.type.findMany({
      where: {
        id: { in: typeIds },
        category: { code: 'REQUEST_TYPE' },
      },
    });

    const requestsByTypeWithNames = requestsByType.map((r) => {
      const type = types.find((t) => t.id === r.typeId);
      return {
        typeId: r.typeId,
        typeName: type?.name || 'Không xác định',
        count: r._count,
      };
    });

    // Get departments for leaveByDepartment and overtimeByDepartment
    const departmentIds = [
      ...leaveByDepartment.map((l) => l.departmentId).filter(Boolean),
      ...overtimeByDepartment.map((o) => o.departmentId).filter(Boolean),
    ];
    const departments = await this.prisma.department.findMany({
      where: {
        id: { in: departmentIds as string[] },
      },
    });

    const leaveByDepartmentWithNames = leaveByDepartment.map((l) => {
      const dept = departments.find((d) => d.id === l.departmentId);
      return {
        departmentId: l.departmentId,
        departmentName: dept?.name || 'Không xác định',
        count: l._count,
      };
    });

    const overtimeByDepartmentWithNames = overtimeByDepartment.map((o) => {
      const dept = departments.find((d) => d.id === o.departmentId);
      return {
        departmentId: o.departmentId,
        departmentName: dept?.name || 'Không xác định',
        totalHours: o._sum.overtimeHours || 0,
      };
    });

    return {
      totalOnLeave,
      paidLeave,
      unpaidLeave,
      resigned,
      resignationReasons: resignationReasons.map((r: any) => ({
        reason: r.reason || 'Không có lý do',
        count: r._count || 0,
      })),
      leaveByDepartment: leaveByDepartmentWithNames,
      overtimeByDepartment: overtimeByDepartmentWithNames,
      overtimeCount,
      absenceCount,
      businessTripCount,
      checkinCount,
      monthlyData,
      requestsByType: requestsByTypeWithNames,
    };
  }

  async remove(id: string, user: User) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check if user is the creator of the request
    const isCreator = request.employeeId === user.employeeId;
    const isAdminOrHR = user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT' || user.role === 'MANAGER' || user.role === 'SUPERVISOR';
    const isPending = request.status?.code === 'PENDING';

    // Check department permission for MANAGER and SUPERVISOR
    if ((user.role === 'MANAGER' || user.role === 'SUPERVISOR') && user.departmentId) {
      if (request.departmentId !== user.departmentId) {
        throw new ForbiddenException('You can only delete requests from your department');
      }
    }

    // Only creator can delete their own request when PENDING, or admin/HR/Manager/Supervisor can delete any
    if (!isAdminOrHR && (!isCreator || !isPending)) {
      throw new ForbiddenException('You can only delete your own pending requests');
    }

    return this.prisma.request.delete({
      where: { id },
    });
  }
}

