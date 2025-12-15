import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding dynamic types...');

  // ============ Employee Status ============
  const employeeStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'EMPLOYEE_STATUS' },
    update: {},
    create: {
      code: 'EMPLOYEE_STATUS',
      name: 'Trạng thái nhân sự',
      description: 'Các trạng thái của nhân sự',
      module: 'EMPLOYEE',
      isActive: true,
    },
  });

  const employeeStatuses = [
    { code: 'PENDING', name: 'Chờ nhận việc', order: 1, color: '#9CA3AF', isDefault: false },
    { code: 'WORKING', name: 'Đang làm việc', order: 2, color: '#10B981', isDefault: true },
    { code: 'PROBATION', name: 'Đang thử việc', order: 3, color: '#F59E0B', isDefault: false },
    { code: 'TEMPORARY_LEAVE', name: 'Nghỉ tạm thời', order: 4, color: '#F97316', isDefault: false },
    { code: 'RESIGNED', name: 'Nghỉ việc', order: 5, color: '#EF4444', isDefault: false },
  ];

  for (const status of employeeStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: employeeStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        ...status,
        categoryId: employeeStatusCategory.id,
        isActive: true,
      },
    });
  }

  // ============ Contract Type ============
  const contractTypeCategory = await prisma.typeCategory.upsert({
    where: { code: 'CONTRACT_TYPE' },
    update: {},
    create: {
      code: 'CONTRACT_TYPE',
      name: 'Loại hợp đồng',
      description: 'Các loại hợp đồng lao động',
      module: 'CONTRACT',
      isActive: true,
    },
  });

  const contractTypes = [
    { code: 'APPRENTICESHIP', name: 'Học việc', order: 1, color: '#3B82F6' },
    { code: 'VOCATIONAL_TRAINING', name: 'Đào tạo nghề', order: 2, color: '#3B82F6' },
    { code: 'FIXED_12_MONTHS_1', name: '12 tháng lần 1', order: 3, color: '#3B82F6' },
    { code: 'FIXED_14_MONTHS_1', name: '14 tháng lần 1', order: 4, color: '#3B82F6' },
    { code: 'FIXED_24_MONTHS_1', name: '24 tháng lần 1', order: 5, color: '#3B82F6' },
    { code: 'FIXED_36_MONTHS_1', name: '36 tháng lần 1', order: 6, color: '#3B82F6' },
    { code: 'PROBATION', name: 'Thử việc', order: 7, color: '#F59E0B' },
    { code: 'SERVICE', name: 'Dịch vụ', order: 8, color: '#8B5CF6' },
    { code: 'INDEFINITE', name: 'Vô thời hạn', order: 9, color: '#10B981' },
    { code: 'FIXED_12_MONTHS_2', name: '12 tháng lần 2', order: 10, color: '#3B82F6' },
    { code: 'FIXED_14_MONTHS_2', name: '14 tháng lần 2', order: 11, color: '#3B82F6' },
    { code: 'FIXED_24_MONTHS_2', name: '24 tháng lần 2', order: 12, color: '#3B82F6' },
    { code: 'FIXED_36_MONTHS_2', name: '36 tháng lần 2', order: 13, color: '#3B82F6' },
  ];

  for (const type of contractTypes) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: contractTypeCategory.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        ...type,
        categoryId: contractTypeCategory.id,
        isActive: true,
        isDefault: false,
      },
    });
  }

  // ============ Contract Status ============
  const contractStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'CONTRACT_STATUS' },
    update: {},
    create: {
      code: 'CONTRACT_STATUS',
      name: 'Trạng thái hợp đồng',
      description: 'Các trạng thái của hợp đồng',
      module: 'CONTRACT',
      isActive: true,
    },
  });

  const contractStatuses = [
    { code: 'ACTIVE', name: 'Đang hoạt động', order: 1, color: '#10B981', isDefault: true },
    { code: 'EXPIRED', name: 'Hết hạn', order: 2, color: '#EF4444', isDefault: false },
    { code: 'TERMINATED', name: 'Chấm dứt', order: 3, color: '#6B7280', isDefault: false },
  ];

  for (const status of contractStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: contractStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        ...status,
        categoryId: contractStatusCategory.id,
        isActive: true,
      },
    });
  }

  // ============ Request Type ============
  const requestTypeCategory = await prisma.typeCategory.upsert({
    where: { code: 'REQUEST_TYPE' },
    update: {},
    create: {
      code: 'REQUEST_TYPE',
      name: 'Loại đơn từ',
      description: 'Các loại đơn từ',
      module: 'REQUEST',
      isActive: true,
    },
  });

  const requestTypes = [
    { code: 'LEAVE', name: 'Đơn xin nghỉ', order: 1, color: '#3B82F6' },
    { code: 'ABSENCE', name: 'Đơn vắng mặt', order: 2, color: '#EF4444' },
    { code: 'OVERTIME', name: 'Đơn làm thêm', order: 3, color: '#F59E0B' },
    { code: 'CHECKIN_CONFIRMATION', name: 'Đơn xác nhận công', order: 4, color: '#10B981' },
    { code: 'SHIFT_CHANGE', name: 'Đơn đổi ca', order: 5, color: '#8B5CF6' },
    { code: 'BUSINESS_TRIP', name: 'Đơn công tác', order: 6, color: '#06B6D4' },
    { code: 'WORK_SCHEDULE', name: 'Đơn làm theo chế độ', order: 7, color: '#EC4899' },
    { code: 'RESIGNATION', name: 'Đơn thôi việc', order: 8, color: '#DC2626' },
  ];

  for (const type of requestTypes) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: requestTypeCategory.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        ...type,
        categoryId: requestTypeCategory.id,
        isActive: true,
        isDefault: false,
      },
    });
  }

  // ============ Request Status ============
  const requestStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'REQUEST_STATUS' },
    update: {},
    create: {
      code: 'REQUEST_STATUS',
      name: 'Trạng thái đơn từ',
      description: 'Các trạng thái của đơn từ',
      module: 'REQUEST',
      isActive: true,
    },
  });

  const requestStatuses = [
    { code: 'PENDING', name: 'Chờ duyệt', order: 1, color: '#F59E0B', isDefault: true },
    { code: 'APPROVED', name: 'Đã duyệt', order: 2, color: '#10B981', isDefault: false },
    { code: 'REJECTED', name: 'Từ chối', order: 3, color: '#EF4444', isDefault: false },
    { code: 'CANCELLED', name: 'Đã hủy', order: 4, color: '#6B7280', isDefault: false },
  ];

  for (const status of requestStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: requestStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        ...status,
        categoryId: requestStatusCategory.id,
        isActive: true,
      },
    });
  }

  // ============ Leave Type ============
  const leaveTypeCategory = await prisma.typeCategory.upsert({
    where: { code: 'LEAVE_TYPE' },
    update: {},
    create: {
      code: 'LEAVE_TYPE',
      name: 'Loại nghỉ phép',
      description: 'Các loại nghỉ phép',
      module: 'REQUEST',
      isActive: true,
    },
  });

  const leaveTypes = [
    { code: 'PAID_LEAVE', name: 'Nghỉ có lương', order: 1, color: '#10B981' },
    { code: 'UNPAID_LEAVE', name: 'Nghỉ không lương', order: 2, color: '#F59E0B' },
    { code: 'SICK_LEAVE', name: 'Nghỉ ốm', order: 3, color: '#EF4444' },
    { code: 'MATERNITY_LEAVE', name: 'Nghỉ thai sản', order: 4, color: '#EC4899' },
    { code: 'OTHER', name: 'Khác', order: 5, color: '#6B7280' },
  ];

  for (const type of leaveTypes) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: leaveTypeCategory.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        ...type,
        categoryId: leaveTypeCategory.id,
        isActive: true,
        isDefault: false,
      },
    });
  }

  // ============ Decision Type ============
  const decisionTypeCategory = await prisma.typeCategory.upsert({
    where: { code: 'DECISION_TYPE' },
    update: {},
    create: {
      code: 'DECISION_TYPE',
      name: 'Loại quyết định',
      description: 'Các loại quyết định',
      module: 'DECISION',
      isActive: true,
    },
  });

  const decisionTypes = [
    { code: 'REWARD', name: 'Khen thưởng', order: 1, color: '#10B981' },
    { code: 'TRANSFER', name: 'Điều chuyển', order: 2, color: '#3B82F6' },
    { code: 'DISCIPLINARY', name: 'Kỷ luật lao động', order: 3, color: '#EF4444' },
    { code: 'DISMISSAL', name: 'Miễn nhiệm', order: 4, color: '#DC2626' },
    { code: 'APPOINTMENT', name: 'Bổ nhiệm', order: 5, color: '#8B5CF6' },
    { code: 'RECEPTION', name: 'Tiếp nhận', order: 6, color: '#06B6D4' },
    { code: 'SALARY_ADJUSTMENT', name: 'Điều chỉnh lương', order: 7, color: '#F59E0B' },
    { code: 'CONTRACT_TERMINATION', name: 'Chấm dứt HĐLĐ', order: 8, color: '#EF4444' },
  ];

  for (const type of decisionTypes) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: decisionTypeCategory.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        ...type,
        categoryId: decisionTypeCategory.id,
        isActive: true,
        isDefault: false,
      },
    });
  }

  // ============ Decision Status ============
  const decisionStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'DECISION_STATUS' },
    update: {},
    create: {
      code: 'DECISION_STATUS',
      name: 'Trạng thái quyết định',
      description: 'Các trạng thái của quyết định',
      module: 'DECISION',
      isActive: true,
    },
  });

  const decisionStatuses = [
    { code: 'ACTIVE', name: 'Đang hiệu lực', order: 1, color: '#10B981', isDefault: true },
    { code: 'CANCELLED', name: 'Đã hủy', order: 2, color: '#6B7280', isDefault: false },
  ];

  for (const status of decisionStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: decisionStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        ...status,
        categoryId: decisionStatusCategory.id,
        isActive: true,
      },
    });
  }

  // ============ Candidate Status ============
  const candidateStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'CANDIDATE_STATUS' },
    update: {},
    create: {
      code: 'CANDIDATE_STATUS',
      name: 'Trạng thái ứng viên',
      description: 'Các trạng thái của ứng viên',
      module: 'CANDIDATE',
      isActive: true,
    },
  });

  const candidateStatuses = [
    // Ứng tuyển
    { code: 'CV_FILTERING', name: 'Lọc CV', order: 1, color: '#9CA3AF', group: 'application' },
    { code: 'CV_PASSED', name: 'Ứng viên đạt', order: 2, color: '#10B981', group: 'application' },
    { code: 'CV_FAILED', name: 'Ứng viên loại', order: 3, color: '#EF4444', group: 'application' },
    { code: 'BLACKLIST', name: 'Blacklist', order: 4, color: '#DC2626', group: 'application' },
    { code: 'CANNOT_CONTACT', name: 'Không liên hệ được', order: 5, color: '#F59E0B', group: 'application' },
    { code: 'AREA_NOT_RECRUITING', name: 'Khu vực chưa tuyển dụng', order: 6, color: '#6B7280', group: 'application' },
    // Phỏng vấn
    { code: 'WAITING_INTERVIEW', name: 'Chờ phỏng vấn', order: 7, color: '#F59E0B', group: 'interview' },
    { code: 'HR_INTERVIEW_PASSED', name: 'HR sơ vấn đạt', order: 8, color: '#10B981', group: 'interview' },
    { code: 'HR_INTERVIEW_FAILED', name: 'HR sơ vấn loại', order: 9, color: '#EF4444', group: 'interview' },
    { code: 'SM_AM_INTERVIEW_PASSED', name: 'SM/AM PV - Đạt', order: 10, color: '#10B981', group: 'interview' },
    { code: 'SM_AM_INTERVIEW_FAILED', name: 'SM/AM PV - Loại', order: 11, color: '#EF4444', group: 'interview' },
    { code: 'SM_AM_INTERVIEW_NO_SHOW', name: 'SM/AM PV - Không đến PV', order: 12, color: '#F59E0B', group: 'interview' },
    { code: 'OM_PV_INTERVIEW_PASSED', name: 'OM/PV - Đạt', order: 13, color: '#10B981', group: 'interview' },
    { code: 'OM_PV_INTERVIEW_FAILED', name: 'OM/PV - Loại', order: 14, color: '#EF4444', group: 'interview' },
    { code: 'OM_PV_INTERVIEW_NO_SHOW', name: 'OM/PV - Không đến PV', order: 15, color: '#F59E0B', group: 'interview' },
    // Thư mời
    { code: 'OFFER_SENT', name: 'Đã gửi offer letter', order: 16, color: '#3B82F6', group: 'offer' },
    { code: 'OFFER_ACCEPTED', name: 'Đồng ý offer', order: 17, color: '#10B981', group: 'offer' },
    { code: 'OFFER_REJECTED', name: 'Từ chối offer', order: 18, color: '#EF4444', group: 'offer' },
    // Trúng tuyển
    { code: 'WAITING_ONBOARDING', name: 'Chờ nhận việc', order: 19, color: '#F59E0B', group: 'onboarding' },
    { code: 'ONBOARDING_ACCEPTED', name: 'Đồng ý nhận việc', order: 20, color: '#10B981', group: 'onboarding' },
    { code: 'ONBOARDING_REJECTED', name: 'Từ chối nhận việc', order: 21, color: '#EF4444', group: 'onboarding' },
  ];

  for (const status of candidateStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: candidateStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        code: status.code,
        name: status.name,
        categoryId: candidateStatusCategory.id,
        order: status.order,
        color: status.color,
        isActive: true,
        isDefault: false,
        metadata: { group: status.group },
      },
    });
  }

  // ============ Interview Type ============
  const interviewTypeCategory = await prisma.typeCategory.upsert({
    where: { code: 'INTERVIEW_TYPE' },
    update: {},
    create: {
      code: 'INTERVIEW_TYPE',
      name: 'Loại phỏng vấn',
      description: 'Các loại phỏng vấn',
      module: 'INTERVIEW',
      isActive: true,
    },
  });

  const interviewTypes = [
    { code: 'HR_SCREENING', name: 'HR Sơ vấn', order: 1, color: '#3B82F6' },
    { code: 'SM_AM_INTERVIEW', name: 'SM/AM Phỏng vấn', order: 2, color: '#8B5CF6' },
    { code: 'OM_PV_INTERVIEW', name: 'OM/PV Phỏng vấn', order: 3, color: '#EC4899' },
  ];

  for (const type of interviewTypes) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: interviewTypeCategory.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        ...type,
        categoryId: interviewTypeCategory.id,
        isActive: true,
        isDefault: false,
      },
    });
  }

  // ============ Interview Result ============
  const interviewResultCategory = await prisma.typeCategory.upsert({
    where: { code: 'INTERVIEW_RESULT' },
    update: {},
    create: {
      code: 'INTERVIEW_RESULT',
      name: 'Kết quả phỏng vấn',
      description: 'Các kết quả phỏng vấn',
      module: 'INTERVIEW',
      isActive: true,
    },
  });

  const interviewResults = [
    { code: 'PASSED', name: 'Đạt', order: 1, color: '#10B981' },
    { code: 'FAILED', name: 'Không đạt', order: 2, color: '#EF4444' },
    { code: 'NO_SHOW', name: 'Không đến', order: 3, color: '#F59E0B' },
  ];

  for (const result of interviewResults) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: interviewResultCategory.id,
          code: result.code,
        },
      },
      update: {},
      create: {
        ...result,
        categoryId: interviewResultCategory.id,
        isActive: true,
        isDefault: false,
      },
    });
  }

  // ============ Proposal Status ============
  const proposalStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'PROPOSAL_STATUS' },
    update: {},
    create: {
      code: 'PROPOSAL_STATUS',
      name: 'Trạng thái đề xuất',
      description: 'Các trạng thái của đề xuất tuyển dụng',
      module: 'PROPOSAL',
      isActive: true,
    },
  });

  const proposalStatuses = [
    { code: 'PENDING', name: 'Chờ duyệt', order: 1, color: '#F59E0B', isDefault: true },
    { code: 'APPROVED', name: 'Đã duyệt', order: 2, color: '#10B981', isDefault: false },
    { code: 'REJECTED', name: 'Từ chối', order: 3, color: '#EF4444', isDefault: false },
  ];

  for (const status of proposalStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: proposalStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        ...status,
        categoryId: proposalStatusCategory.id,
        isActive: true,
      },
    });
  }

  // ============ Timekeeping Status ============
  const timekeepingStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'TIMEKEEPING_STATUS' },
    update: {},
    create: {
      code: 'TIMEKEEPING_STATUS',
      name: 'Trạng thái chấm công',
      description: 'Các trạng thái chấm công',
      module: 'TIMEKEEPING',
      isActive: true,
    },
  });

  const timekeepingStatuses = [
    { code: 'NORMAL', name: 'Bình thường', order: 1, color: '#10B981', isDefault: true },
    { code: 'LATE', name: 'Đi muộn', order: 2, color: '#F59E0B', isDefault: false },
    { code: 'EARLY_LEAVE', name: 'Về sớm', order: 3, color: '#F59E0B', isDefault: false },
    { code: 'ABSENT', name: 'Vắng mặt', order: 4, color: '#EF4444', isDefault: false },
    { code: 'OVERTIME', name: 'Tăng ca', order: 5, color: '#8B5CF6', isDefault: false },
  ];

  for (const status of timekeepingStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: timekeepingStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        ...status,
        categoryId: timekeepingStatusCategory.id,
        isActive: true,
      },
    });
  }

  // ============ Payroll Status ============
  const payrollStatusCategory = await prisma.typeCategory.upsert({
    where: { code: 'PAYROLL_STATUS' },
    update: {},
    create: {
      code: 'PAYROLL_STATUS',
      name: 'Trạng thái bảng lương',
      description: 'Các trạng thái của bảng lương',
      module: 'PAYROLL',
      isActive: true,
    },
  });

  const payrollStatuses = [
    { code: 'PENDING', name: 'Chờ xử lý', order: 1, color: '#9CA3AF', isDefault: true },
    { code: 'CALCULATED', name: 'Đã tính', order: 2, color: '#3B82F6', isDefault: false },
    { code: 'APPROVED', name: 'Đã duyệt', order: 3, color: '#10B981', isDefault: false },
    { code: 'PAID', name: 'Đã thanh toán', order: 4, color: '#10B981', isDefault: false },
    { code: 'CANCELLED', name: 'Đã hủy', order: 5, color: '#6B7280', isDefault: false },
  ];

  for (const status of payrollStatuses) {
    await prisma.type.upsert({
      where: {
        categoryId_code: {
          categoryId: payrollStatusCategory.id,
          code: status.code,
        },
      },
      update: {},
      create: {
        ...status,
        categoryId: payrollStatusCategory.id,
        isActive: true,
      },
    });
  }

  console.log('✅ Types seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

