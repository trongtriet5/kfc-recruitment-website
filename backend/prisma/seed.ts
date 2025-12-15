import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Helper function to get Type ID by category code and type code
async function getTypeId(categoryCode: string, typeCode: string): Promise<string> {
  const category = await prisma.typeCategory.findUnique({
    where: { code: categoryCode },
  });
  if (!category) {
    throw new Error(`Category ${categoryCode} not found`);
  }

  const type = await prisma.type.findUnique({
    where: {
      categoryId_code: {
        categoryId: category.id,
        code: typeCode,
      },
    },
  });
  if (!type) {
    throw new Error(`Type ${typeCode} not found in category ${categoryCode}`);
  }

  return type.id;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Get Type IDs
  console.log('📦 Loading Type IDs...');
  const employeeStatusWorking = await getTypeId('EMPLOYEE_STATUS', 'WORKING');
  const employeeStatusProbation = await getTypeId('EMPLOYEE_STATUS', 'PROBATION');
  const candidateStatusCvPassed = await getTypeId('CANDIDATE_STATUS', 'CV_PASSED');
  const candidateStatusWaitingInterview = await getTypeId('CANDIDATE_STATUS', 'WAITING_INTERVIEW');
  const candidateStatusHrInterviewPassed = await getTypeId('CANDIDATE_STATUS', 'HR_INTERVIEW_PASSED');
  const candidateStatusOfferSent = await getTypeId('CANDIDATE_STATUS', 'OFFER_SENT');
  const candidateStatusOnboardingAccepted = await getTypeId('CANDIDATE_STATUS', 'ONBOARDING_ACCEPTED');
  const candidateStatusCvFailed = await getTypeId('CANDIDATE_STATUS', 'CV_FAILED');
  const interviewTypeHrScreening = await getTypeId('INTERVIEW_TYPE', 'HR_SCREENING');
  const interviewResultPassed = await getTypeId('INTERVIEW_RESULT', 'PASSED');
  const requestTypeLeave = await getTypeId('REQUEST_TYPE', 'LEAVE');
  const requestTypeOvertime = await getTypeId('REQUEST_TYPE', 'OVERTIME');
  const requestStatusApproved = await getTypeId('REQUEST_STATUS', 'APPROVED');
  const requestStatusPending = await getTypeId('REQUEST_STATUS', 'PENDING');
  const leaveTypePaidLeave = await getTypeId('LEAVE_TYPE', 'PAID_LEAVE');
  const contractTypeIndefinite = await getTypeId('CONTRACT_TYPE', 'INDEFINITE');
  const contractTypeFixed12Months1 = await getTypeId('CONTRACT_TYPE', 'FIXED_12_MONTHS_1');
  const contractStatusActive = await getTypeId('CONTRACT_STATUS', 'ACTIVE');
  const decisionTypeAppointment = await getTypeId('DECISION_TYPE', 'APPOINTMENT');
  const decisionTypeReward = await getTypeId('DECISION_TYPE', 'REWARD');
  const decisionStatusActive = await getTypeId('DECISION_STATUS', 'ACTIVE');
  const proposalStatusApproved = await getTypeId('PROPOSAL_STATUS', 'APPROVED');
  const proposalStatusPending = await getTypeId('PROPOSAL_STATUS', 'PENDING');
  const timekeepingStatusNormal = await getTypeId('TIMEKEEPING_STATUS', 'NORMAL');

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Tạo user admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@maycha.com' },
    update: {},
    create: {
      email: 'admin@maycha.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Tạo departments
  const hrDept = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      code: 'HR',
      name: 'Nhân sự',
      description: 'Phòng ban nhân sự',
      isActive: true,
    },
  });

  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      code: 'IT',
      name: 'Công nghệ thông tin',
      description: 'Phòng ban IT',
      isActive: true,
    },
  });

  const salesDept = await prisma.department.upsert({
    where: { code: 'SALES' },
    update: {},
    create: {
      code: 'SALES',
      name: 'Kinh doanh',
      description: 'Phòng ban kinh doanh',
      isActive: true,
    },
  });

  const storeDept = await prisma.department.upsert({
    where: { code: 'STORE' },
    update: {},
    create: {
      code: 'STORE',
      name: 'Cửa hàng',
      description: 'Phòng ban cửa hàng',
      isActive: true,
    },
  });

  console.log('✅ Created departments');

  // Tạo positions
  const hrManager = await prisma.position.upsert({
    where: { code: 'HR_MANAGER' },
    update: {},
    create: {
      code: 'HR_MANAGER',
      name: 'Trưởng phòng Nhân sự',
      description: 'Vị trí trưởng phòng nhân sự',
      isActive: true,
    },
  });

  const hrStaff = await prisma.position.upsert({
    where: { code: 'HR_STAFF' },
    update: {},
    create: {
      code: 'HR_STAFF',
      name: 'Nhân viên Nhân sự',
      description: 'Vị trí nhân viên nhân sự',
      isActive: true,
    },
  });

  const storeManager = await prisma.position.upsert({
    where: { code: 'STORE_MANAGER' },
    update: {},
    create: {
      code: 'STORE_MANAGER',
      name: 'Quản lý cửa hàng',
      description: 'Vị trí quản lý cửa hàng',
      isActive: true,
    },
  });

  const cashier = await prisma.position.upsert({
    where: { code: 'CASHIER' },
    update: {},
    create: {
      code: 'CASHIER',
      name: 'Thu ngân',
      description: 'Vị trí thu ngân',
      isActive: true,
    },
  });

  const barista = await prisma.position.upsert({
    where: { code: 'BARISTA' },
    update: {},
    create: {
      code: 'BARISTA',
      name: 'Barista',
      description: 'Vị trí pha chế',
      isActive: true,
    },
  });

  const server = await prisma.position.upsert({
    where: { code: 'SERVER' },
    update: {},
    create: {
      code: 'SERVER',
      name: 'Phục vụ',
      description: 'Vị trí phục vụ',
      isActive: true,
    },
  });

  console.log('✅ Created positions');

  // Tạo stores
  const store1 = await prisma.store.upsert({
    where: { code: 'STORE_001' },
    update: {},
    create: {
      code: 'STORE_001',
      name: 'Maycha Quận 1',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      brand: 'MAYCHA',
      isActive: true,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { code: 'STORE_002' },
    update: {},
    create: {
      code: 'STORE_002',
      name: 'Maycha Quận 3',
      address: '456 Lê Lợi, Quận 3, TP.HCM',
      brand: 'MAYCHA',
      isActive: true,
    },
  });

  const store3 = await prisma.store.upsert({
    where: { code: 'STORE_003' },
    update: {},
    create: {
      code: 'STORE_003',
      name: 'Tam Hảo Quận 7',
      address: '789 Nguyễn Văn Linh, Quận 7, TP.HCM',
      brand: 'TAM_HAO',
      isActive: true,
    },
  });

  console.log('✅ Created stores');

  // Tạo employees
  const employees = [
    {
      employeeCode: 'EMP001',
      fullName: 'Nguyễn Văn An',
      email: 'nguyenvanan@maycha.com',
      phone: '0901234567',
      gender: 'MALE',
      dateOfBirth: new Date('1995-05-15'),
      address: '123 Đường ABC, Quận 1, TP.HCM',
      idCard: '079123456789',
      education: 'UNIVERSITY',
      statusId: employeeStatusWorking,
      departmentId: hrDept.id,
      positionId: hrManager.id,
      brand: 'MAYCHA',
      contractTypeId: contractTypeIndefinite,
      startDate: new Date('2023-01-01'),
      salary: 15000000,
      insuranceNumber: 'BH001',
    },
    {
      employeeCode: 'EMP002',
      fullName: 'Trần Thị Bình',
      email: 'tranthibinh@maycha.com',
      phone: '0902345678',
      gender: 'FEMALE',
      dateOfBirth: new Date('1998-08-20'),
      address: '456 Đường XYZ, Quận 3, TP.HCM',
      idCard: '079234567890',
      education: 'COLLEGE',
      statusId: employeeStatusWorking,
      departmentId: storeDept.id,
      positionId: storeManager.id,
      storeId: store1.id,
      brand: 'MAYCHA',
      contractTypeId: contractTypeFixed12Months1,
      startDate: new Date('2023-06-01'),
      salary: 12000000,
      insuranceNumber: 'BH002',
    },
    {
      employeeCode: 'EMP003',
      fullName: 'Lê Văn Cường',
      email: 'levancuong@maycha.com',
      phone: '0903456789',
      gender: 'MALE',
      dateOfBirth: new Date('2000-03-10'),
      address: '789 Đường DEF, Quận 7, TP.HCM',
      idCard: '079345678901',
      education: 'HIGH_SCHOOL',
      statusId: employeeStatusWorking,
      departmentId: storeDept.id,
      positionId: barista.id,
      storeId: store1.id,
      brand: 'MAYCHA',
      contractTypeId: contractTypeFixed12Months1,
      startDate: new Date('2024-01-15'),
      salary: 8000000,
      insuranceNumber: 'BH003',
    },
    {
      employeeCode: 'EMP004',
      fullName: 'Phạm Thị Dung',
      email: 'phamthidung@maycha.com',
      phone: '0904567890',
      gender: 'FEMALE',
      dateOfBirth: new Date('1999-11-25'),
      address: '321 Đường GHI, Quận 3, TP.HCM',
      idCard: '079456789012',
      education: 'COLLEGE',
      statusId: employeeStatusWorking,
      departmentId: storeDept.id,
      positionId: cashier.id,
      storeId: store2.id,
      brand: 'MAYCHA',
      contractTypeId: contractTypeFixed12Months1,
      startDate: new Date('2024-02-01'),
      salary: 7500000,
      insuranceNumber: 'BH004',
    },
    {
      employeeCode: 'EMP005',
      fullName: 'Hoàng Văn Em',
      email: 'hoangvanem@maycha.com',
      phone: '0905678901',
      gender: 'MALE',
      dateOfBirth: new Date('2001-07-05'),
      address: '654 Đường JKL, Quận 7, TP.HCM',
      idCard: '079567890123',
      education: 'HIGH_SCHOOL',
      statusId: employeeStatusProbation,
      departmentId: storeDept.id,
      positionId: server.id,
      storeId: store3.id,
      brand: 'TAM_HAO',
      contractTypeId: await getTypeId('CONTRACT_TYPE', 'PROBATION'),
      startDate: new Date('2024-12-01'),
      salary: 7000000,
    },
  ];

  for (const empData of employees) {
    await prisma.employee.upsert({
      where: { employeeCode: empData.employeeCode },
      update: {},
      create: {
        employeeCode: empData.employeeCode,
        fullName: empData.fullName,
        email: empData.email,
        phone: empData.phone,
        gender: empData.gender as any,
        dateOfBirth: empData.dateOfBirth,
        address: empData.address,
        idCard: empData.idCard,
        education: empData.education as any,
        statusId: empData.statusId || employeeStatusWorking,
        departmentId: empData.departmentId,
        positionId: empData.positionId,
        storeId: empData.storeId,
        brand: empData.brand as any,
        contractTypeId: empData.contractTypeId,
        startDate: empData.startDate,
        salary: empData.salary,
        insuranceNumber: empData.insuranceNumber,
      },
    });
  }

  console.log('✅ Created employees:', employees.length);

  // Tạo users cho employees
  const emp1 = await prisma.employee.findUnique({ where: { employeeCode: 'EMP001' } });
  const emp2 = await prisma.employee.findUnique({ where: { employeeCode: 'EMP002' } });

  if (emp1) {
    await prisma.user.upsert({
      where: { email: emp1.email! },
      update: {},
      create: {
        email: emp1.email!,
        password: hashedPassword,
        fullName: emp1.fullName,
        role: 'HEAD_OF_DEPARTMENT',
        departmentId: emp1.departmentId,
        positionId: emp1.positionId,
        employeeId: emp1.id,
        isActive: true,
      },
    });
  }

  if (emp2) {
    await prisma.user.upsert({
      where: { email: emp2.email! },
      update: {},
      create: {
        email: emp2.email!,
        password: hashedPassword,
        fullName: emp2.fullName,
        role: 'MANAGER',
        departmentId: emp2.departmentId,
        positionId: emp2.positionId,
        employeeId: emp2.id,
        isActive: true,
      },
    });
  }

  console.log('✅ Created user accounts for employees');

  // Tạo recruitment forms
  const form1 = await prisma.recruitmentForm.upsert({
    where: { link: 'maycha-2024' },
    update: {},
    create: {
      title: 'Tuyển dụng Maycha 2024',
      description: 'Form tuyển dụng cho các vị trí tại Maycha',
      brand: 'MAYCHA',
      source: 'Website',
      link: 'maycha-2024',
      isActive: true,
    },
  });

  const form2 = await prisma.recruitmentForm.upsert({
    where: { link: 'tamhao-2024' },
    update: {},
    create: {
      title: 'Tuyển dụng Tam Hảo 2024',
      description: 'Form tuyển dụng cho các vị trí tại Tam Hảo',
      brand: 'TAM_HAO',
      source: 'Website',
      link: 'tamhao-2024',
      isActive: true,
    },
  });

  console.log('✅ Created recruitment forms');

  // Tạo candidates
  const candidates = [
    {
      fullName: 'Nguyễn Thị Lan',
      email: 'nguyenthilan@gmail.com',
      phone: '0911111111',
      formId: form1.id,
      statusId: candidateStatusCvPassed,
      brand: 'MAYCHA',
      position: 'Barista',
      storeId: store1.id,
      notes: 'CV tốt, có kinh nghiệm',
    },
    {
      fullName: 'Trần Văn Minh',
      email: 'tranvanminh@gmail.com',
      phone: '0922222222',
      formId: form1.id,
      statusId: candidateStatusWaitingInterview,
      brand: 'MAYCHA',
      position: 'Thu ngân',
      storeId: store2.id,
      notes: 'Đã pass CV, chờ phỏng vấn',
    },
    {
      fullName: 'Lê Thị Hoa',
      email: 'lethihoa@gmail.com',
      phone: '0933333333',
      formId: form1.id,
      statusId: candidateStatusHrInterviewPassed,
      brand: 'MAYCHA',
      position: 'Phục vụ',
      storeId: store1.id,
      notes: 'HR sơ vấn đạt',
    },
    {
      fullName: 'Phạm Văn Đức',
      email: 'phamvanduc@gmail.com',
      phone: '0944444444',
      formId: form2.id,
      statusId: candidateStatusOfferSent,
      brand: 'TAM_HAO',
      position: 'Barista',
      storeId: store3.id,
      notes: 'Đã gửi offer letter',
    },
    {
      fullName: 'Hoàng Thị Mai',
      email: 'hoangthimai@gmail.com',
      phone: '0955555555',
      formId: form1.id,
      statusId: candidateStatusOnboardingAccepted,
      brand: 'MAYCHA',
      position: 'Phục vụ',
      storeId: store2.id,
      notes: 'Đã đồng ý nhận việc',
    },
    {
      fullName: 'Vũ Văn Tuấn',
      email: 'vuvantuan@gmail.com',
      phone: '0966666666',
      formId: form1.id,
      statusId: candidateStatusCvFailed,
      brand: 'MAYCHA',
      position: 'Quản lý cửa hàng',
      notes: 'Không đủ kinh nghiệm',
    },
  ];

  for (const candidateData of candidates) {
    await prisma.candidate.create({
      data: {
        fullName: candidateData.fullName,
        email: candidateData.email,
        phone: candidateData.phone,
        formId: candidateData.formId,
        statusId: candidateData.statusId,
        brand: candidateData.brand as any,
        position: candidateData.position,
        storeId: candidateData.storeId,
        notes: candidateData.notes,
      },
    });
  }

  console.log('✅ Created candidates:', candidates.length);

  // Tạo interviews
  const candidate1 = await prisma.candidate.findFirst({ where: { phone: '0922222222' } });
  const candidate2 = await prisma.candidate.findFirst({ where: { phone: '0933333333' } });

  if (candidate1 && admin) {
    await prisma.interview.create({
      data: {
        candidateId: candidate1.id,
        interviewerId: admin.id,
        typeId: interviewTypeHrScreening,
        scheduledAt: new Date('2024-12-15T10:00:00'),
        location: 'Văn phòng Maycha',
        notes: 'Phỏng vấn sơ bộ',
      },
    });
  }

  if (candidate2 && admin) {
    await prisma.interview.create({
      data: {
        candidateId: candidate2.id,
        interviewerId: admin.id,
        typeId: interviewTypeHrScreening,
        scheduledAt: new Date('2024-12-10T14:00:00'),
        location: 'Văn phòng Maycha',
        notes: 'Đã phỏng vấn, đạt',
        resultId: interviewResultPassed,
      },
    });
  }

  console.log('✅ Created interviews');

  // Tạo requests
  const emp3 = await prisma.employee.findUnique({ where: { employeeCode: 'EMP003' } });
  const emp4 = await prisma.employee.findUnique({ where: { employeeCode: 'EMP004' } });

  // Create requests for current month
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  // Create dates in current month
  const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const currentMonthMid = new Date(currentYear, currentMonth - 1, 15);
  const currentMonthEnd = new Date(currentYear, currentMonth, 0);

  if (emp3) {
    // Approved leave request in current month
    await prisma.request.create({
      data: {
        typeId: requestTypeLeave,
        statusId: requestStatusApproved,
        employeeId: emp3.id,
        departmentId: emp3.departmentId,
        startDate: new Date(currentYear, currentMonth - 1, 5),
        endDate: new Date(currentYear, currentMonth - 1, 7),
        leaveTypeId: leaveTypePaidLeave,
        reason: 'Nghỉ phép cuối năm',
        approverId: admin.id,
        approvedAt: new Date(currentYear, currentMonth - 1, 1),
      },
    });

    // Approved overtime request in current month
    await prisma.request.create({
      data: {
        typeId: requestTypeOvertime,
        statusId: requestStatusApproved,
        employeeId: emp3.id,
        departmentId: emp3.departmentId,
        overtimeHours: 4,
        overtimeDate: new Date(currentYear, currentMonth - 1, 10),
        reason: 'Tăng ca cuối tuần',
        approverId: admin.id,
        approvedAt: new Date(currentYear, currentMonth - 1, 9),
      },
    });
  }

  if (emp4) {
    // Pending leave request in current month
    await prisma.request.create({
      data: {
        typeId: requestTypeLeave,
        statusId: requestStatusPending,
        employeeId: emp4.id,
        departmentId: emp4.departmentId,
        startDate: new Date(currentYear, currentMonth - 1, 20),
        endDate: new Date(currentYear, currentMonth - 1, 22),
        leaveTypeId: leaveTypePaidLeave,
        reason: 'Nghỉ lễ',
      },
    });
  }

  console.log('✅ Created requests');

  // Tạo contracts
  if (emp1) {
    await prisma.contract.create({
      data: {
        employeeId: emp1.id,
        typeId: contractTypeIndefinite,
        startDate: new Date('2023-01-01'),
        salary: 15000000,
        position: 'Trưởng phòng Nhân sự',
        department: 'Nhân sự',
          statusId: contractStatusActive,
        createdById: admin.id,
      },
    });
  }

  if (emp2) {
    await prisma.contract.create({
      data: {
        employeeId: emp2.id,
        typeId: contractTypeFixed12Months1,
        startDate: new Date('2023-06-01'),
        endDate: new Date('2024-06-01'),
        salary: 12000000,
        position: 'Quản lý cửa hàng',
        department: 'Cửa hàng',
          statusId: contractStatusActive,
        createdById: admin.id,
      },
    });
  }

  console.log('✅ Created contracts');

  // Tạo timekeeping records
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (emp3) {
    // Tạo 10 ngày chấm công trong tháng này
    for (let i = 1; i <= 10; i++) {
      const date = new Date(thisMonth);
      date.setDate(i);
      
      const checkIn = new Date(date);
      checkIn.setHours(8, 0, 0);
      
      const checkOut = new Date(date);
      checkOut.setHours(17, 0, 0);

      await prisma.timekeeping.upsert({
        where: {
          employeeId_date: {
            employeeId: emp3.id,
            date: date,
          },
        },
        update: {},
        create: {
          employeeId: emp3.id,
          date: date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          checkInLat: 10.7769,
          checkInLng: 106.7009,
          checkOutLat: 10.7769,
          checkOutLng: 106.7009,
          workHours: 8,
          statusId: timekeepingStatusNormal,
        },
      });
    }
  }

  if (emp4) {
    // Tạo 8 ngày chấm công
    for (let i = 1; i <= 8; i++) {
      const date = new Date(thisMonth);
      date.setDate(i);
      
      const checkIn = new Date(date);
      checkIn.setHours(7, 30, 0);
      
      const checkOut = new Date(date);
      checkOut.setHours(16, 30, 0);

      await prisma.timekeeping.upsert({
        where: {
          employeeId_date: {
            employeeId: emp4.id,
            date: date,
          },
        },
        update: {},
        create: {
          employeeId: emp4.id,
          date: date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          checkInLat: 10.7829,
          checkInLng: 106.6959,
          checkOutLat: 10.7829,
          checkOutLng: 106.6959,
          workHours: 8,
          statusId: timekeepingStatusNormal,
        },
      });
    }
  }

  console.log('✅ Created timekeeping records');

  // Tạo decisions
  if (emp1) {
    await prisma.decision.create({
      data: {
        typeId: decisionTypeAppointment,
        employeeId: emp1.id,
        title: 'Quyết định bổ nhiệm Trưởng phòng Nhân sự',
        content: 'Bổ nhiệm ông/bà Nguyễn Văn An giữ chức vụ Trưởng phòng Nhân sự',
        effectiveDate: new Date('2023-01-01'),
          statusId: contractStatusActive,
        createdById: admin.id,
      },
    });
  }

  if (emp2) {
    await prisma.decision.create({
      data: {
        typeId: decisionTypeReward,
        employeeId: emp2.id,
        title: 'Quyết định khen thưởng',
        content: 'Khen thưởng vì hoàn thành tốt công việc trong quý 4/2024',
        effectiveDate: new Date('2024-12-01'),
          statusId: contractStatusActive,
        createdById: admin.id,
      },
    });
  }

  console.log('✅ Created decisions');

  // Tạo recruitment proposals
  const proposal1 = await prisma.recruitmentProposal.create({
    data: {
      title: 'Tuyển dụng Barista cho Maycha Quận 1',
      description: 'Cần tuyển 2 Barista cho cửa hàng Quận 1',
      storeId: store1.id,
      positionId: barista.id,
      quantity: 2,
      reason: 'Mở rộng kinh doanh',
      statusId: proposalStatusApproved,
      approverId: admin.id,
      approvedAt: new Date('2024-11-01'),
    },
  });

  const proposal2 = await prisma.recruitmentProposal.create({
    data: {
      title: 'Tuyển dụng Thu ngân cho Maycha Quận 3',
      description: 'Cần tuyển 1 Thu ngân',
      storeId: store2.id,
      positionId: cashier.id,
      quantity: 1,
      reason: 'Nhân viên nghỉ việc',
      statusId: proposalStatusPending,
    },
  });

  console.log('✅ Created recruitment proposals');

  // Tạo headcounts
  const headcount1 = await prisma.headcount.create({
    data: {
      code: 'DB2024M12-1',
      name: 'Định biên tháng 12/2024 - Barista',
      period: 'MONTH',
      departmentId: storeDept.id,
      storeId: store1.id,
      year: 2024,
      month: 12,
      positions: {
        create: {
          positionId: barista.id,
          current: 3,
          target: 5,
        },
      },
    },
  });

  const headcount2 = await prisma.headcount.create({
    data: {
      code: 'DB2024M12-2',
      name: 'Định biên tháng 12/2024 - Cashier',
      period: 'MONTH',
      departmentId: storeDept.id,
      storeId: store2.id,
      year: 2024,
      month: 12,
      positions: {
        create: {
          positionId: cashier.id,
          current: 2,
          target: 3,
        },
      },
    },
  });

  console.log('✅ Created headcounts');

  console.log('🎉 Seed completed!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@maycha.com');
  console.log('   Password: admin123');
  console.log('\n👥 Employee accounts:');
  console.log('   HR: nguyenvanan@maycha.com / admin123');
  console.log('   Manager: tranthibinh@maycha.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
