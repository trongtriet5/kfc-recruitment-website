import { PrismaClient, Brand, UserRole, Gender, Education } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Helper function to get Type ID
async function getTypeId(categoryCode: string, typeCode: string): Promise<string> {
  const category = await prisma.typeCategory.findUnique({
    where: { code: categoryCode },
  });

  if (!category) {
    throw new Error(`Category not found: ${categoryCode}`);
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
    throw new Error(`Type not found: ${categoryCode}.${typeCode}`);
  }

  return type.id;
}

// Vietnamese names generator
const firstNames = [
  'An', 'Bình', 'Chi', 'Dũng', 'Hoa', 'Hùng', 'Lan', 'Long', 'Mai', 'Nam',
  'Nga', 'Phong', 'Quang', 'Thảo', 'Tuấn', 'Vân', 'Yến', 'Đức', 'Hạnh', 'Khang',
  'Linh', 'Minh', 'Ngọc', 'Phương', 'Quân', 'Sơn', 'Thành', 'Uyên', 'Việt', 'Xuân'
];

const lastNames = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Tô', 'Trương'
];

function generateVietnameseName(): string {
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  return `${lastName} ${firstName}`;
}

function generatePhone(): string {
  const prefixes = ['090', '091', '092', '093', '094', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${number}`;
}

function generateEmail(name: string, index?: number): string {
  const cleanName = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, '');
  const suffix = index !== undefined ? index : Math.floor(Math.random() * 10000);
  return `${cleanName}${suffix}@maycha.com`;
}

function generateDateOfBirth(): Date {
  const year = 1980 + Math.floor(Math.random() * 30);
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

function generateIdCard(): string {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

const districts = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
  'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Tân Phú',
  'Phú Nhuận', 'Gò Vấp', 'Thủ Đức', 'Bình Tân', 'Hóc Môn', 'Củ Chi', 'Nhà Bè', 'Cần Giờ'
];

function generateAddress(district?: string): string {
  const streetNumbers = Math.floor(Math.random() * 200) + 1;
  const streetNames = ['Nguyễn Văn Cừ', 'Lê Lợi', 'Trần Hưng Đạo', 'Nguyễn Huệ', 'Lý Tự Trọng', 'Điện Biên Phủ', 'Võ Văn Tần', 'Pasteur'];
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  const dist = district || districts[Math.floor(Math.random() * districts.length)];
  return `${streetNumbers} ${street}, ${dist}, TP.HCM`;
}

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  const hashedPassword = await bcrypt.hash('admin123', 12);
  const defaultPassword = await bcrypt.hash('123456', 12);

  // Get Type IDs
  console.log('📦 Loading Type IDs...');
  const employeeStatusWorking = await getTypeId('EMPLOYEE_STATUS', 'WORKING');
  const candidateStatusCvPassed = await getTypeId('CANDIDATE_STATUS', 'CV_PASSED');
  const candidateStatusWaitingInterview = await getTypeId('CANDIDATE_STATUS', 'WAITING_INTERVIEW');
  const candidateStatusOnboardingAccepted = await getTypeId('CANDIDATE_STATUS', 'ONBOARDING_ACCEPTED');
  const requestTypeLeave = await getTypeId('REQUEST_TYPE', 'LEAVE');
  const requestTypeOvertime = await getTypeId('REQUEST_TYPE', 'OVERTIME');
  const requestTypeAbsence = await getTypeId('REQUEST_TYPE', 'ABSENCE');
  const requestTypeCheckinConfirmation = await getTypeId('REQUEST_TYPE', 'CHECKIN_CONFIRMATION');
  const requestTypeShiftChange = await getTypeId('REQUEST_TYPE', 'SHIFT_CHANGE');
  const requestTypeBusinessTrip = await getTypeId('REQUEST_TYPE', 'BUSINESS_TRIP');
  const requestTypeWorkSchedule = await getTypeId('REQUEST_TYPE', 'WORK_SCHEDULE');
  const requestTypeResignation = await getTypeId('REQUEST_TYPE', 'RESIGNATION');
  const requestStatusApproved = await getTypeId('REQUEST_STATUS', 'APPROVED');
  const requestStatusPending = await getTypeId('REQUEST_STATUS', 'PENDING');
  const requestStatusRejected = await getTypeId('REQUEST_STATUS', 'REJECTED');
  const leaveTypePaidLeave = await getTypeId('LEAVE_TYPE', 'PAID_LEAVE');
  const leaveTypeUnpaidLeave = await getTypeId('LEAVE_TYPE', 'UNPAID_LEAVE');
  const leaveTypeSickLeave = await getTypeId('LEAVE_TYPE', 'SICK_LEAVE');
  const contractTypeIndefinite = await getTypeId('CONTRACT_TYPE', 'INDEFINITE');
  const contractStatusActive = await getTypeId('CONTRACT_STATUS', 'ACTIVE');
  const timekeepingStatusNormal = await getTypeId('TIMEKEEPING_STATUS', 'NORMAL');
  const payrollStatusPaid = await getTypeId('PAYROLL_STATUS', 'PAID');

  // ============ 1. CREATE ADMIN USER ============
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@maycha.com' },
    update: {},
    create: {
      email: 'admin@maycha.com',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'ADMIN' as UserRole,
      isActive: true,
    },
  });
  console.log('✅ Created admin user');

  // ============ 2. CREATE DEPARTMENTS (Khối văn phòng) ============
  console.log('🏢 Creating departments...');
  const departments = [
    { code: 'VP-HR', name: 'Phòng Nhân sự', description: 'Khối văn phòng - Nhân sự' },
    { code: 'VP-FIN', name: 'Phòng Tài chính', description: 'Khối văn phòng - Tài chính' },
    { code: 'VP-IT', name: 'Phòng Công nghệ thông tin', description: 'Khối văn phòng - IT' },
    { code: 'VP-MKT', name: 'Phòng Marketing', description: 'Khối văn phòng - Marketing' },
    { code: 'VP-OP', name: 'Phòng Vận hành', description: 'Khối văn phòng - Vận hành' },
    { code: 'VP-SALE', name: 'Phòng Kinh doanh', description: 'Khối văn phòng - Kinh doanh' },
    { code: 'VP-QC', name: 'Phòng Chất lượng', description: 'Khối văn phòng - Chất lượng' },
    { code: 'VP-LOG', name: 'Phòng Logistics', description: 'Khối văn phòng - Logistics' },
  ];

  const createdDepartments: { [key: string]: any } = {};
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    createdDepartments[dept.code] = created;
  }
  console.log(`✅ Created ${departments.length} departments`);

  // ============ 3. CREATE POSITIONS ============
  console.log('💼 Creating positions...');
  const positions = [
    { code: 'POS-001', name: 'Giám đốc', description: 'Giám đốc' },
    { code: 'POS-002', name: 'Phó giám đốc', description: 'Phó giám đốc' },
    { code: 'POS-003', name: 'Trưởng phòng', description: 'Trưởng phòng' },
    { code: 'POS-004', name: 'Phó phòng', description: 'Phó phòng' },
    { code: 'POS-005', name: 'Quản lý', description: 'Quản lý' },
    { code: 'POS-006', name: 'Giám sát', description: 'Giám sát' },
    { code: 'POS-007', name: 'Nhân viên', description: 'Nhân viên' },
    { code: 'POS-008', name: 'Bếp trưởng', description: 'Bếp trưởng' },
    { code: 'POS-009', name: 'Đầu bếp', description: 'Đầu bếp' },
    { code: 'POS-010', name: 'Phục vụ', description: 'Nhân viên phục vụ' },
    { code: 'POS-011', name: 'Thu ngân', description: 'Nhân viên thu ngân' },
    { code: 'POS-012', name: 'Bảo vệ', description: 'Nhân viên bảo vệ' },
    { code: 'POS-013', name: 'Tạp vụ', description: 'Nhân viên tạp vụ' },
  ];

  const createdPositions: { [key: string]: any } = {};
  for (const pos of positions) {
    const created = await prisma.position.upsert({
      where: { code: pos.code },
      update: {},
      create: pos,
    });
    createdPositions[pos.code] = created;
  }
  console.log(`✅ Created ${positions.length} positions`);

  // ============ 4. CREATE STORES - TAM HAO (BB001-BB120) ============
  console.log('🏪 Creating Tam Hảo stores (BB001-BB120)...');
  const tamHaoStores = [];
  for (let i = 1; i <= 120; i++) {
    const code = `BB${String(i).padStart(3, '0')}`;
    const district = districts[Math.floor(Math.random() * districts.length)];
    tamHaoStores.push({
      code,
      name: `Tam Hảo ${code}`,
      address: generateAddress(district),
      brand: Brand.TAM_HAO,
      isActive: true,
    });
  }

  const createdTamHaoStores: any[] = [];
  for (const store of tamHaoStores) {
    const created = await prisma.store.upsert({
      where: { code: store.code },
      update: {},
      create: store,
    });
    createdTamHaoStores.push(created);
  }
  console.log(`✅ Created ${tamHaoStores.length} Tam Hảo stores`);

  // ============ 5. CREATE STORES - MAYCHA (MC001-MC120) ============
  console.log('🏪 Creating Maycha stores (MC001-MC120)...');
  const maychaStores = [];
  for (let i = 1; i <= 120; i++) {
    const code = `MC${String(i).padStart(3, '0')}`;
    const district = districts[Math.floor(Math.random() * districts.length)];
    maychaStores.push({
      code,
      name: `Maycha ${code}`,
      address: generateAddress(district),
      brand: Brand.MAYCHA,
      isActive: true,
    });
  }

  const createdMaychaStores: any[] = [];
  for (const store of maychaStores) {
    const created = await prisma.store.upsert({
      where: { code: store.code },
      update: {},
      create: store,
    });
    createdMaychaStores.push(created);
  }
  console.log(`✅ Created ${maychaStores.length} Maycha stores`);

  // ============ 6. CREATE USERS WITH DIFFERENT ROLES ============
  console.log('👥 Creating users with different roles...');
  const users = [];

  // Head of Department users
  for (let i = 1; i <= 5; i++) {
    const name = generateVietnameseName();
    users.push({
      email: generateEmail(name, i),
      password: defaultPassword,
      fullName: name,
      role: 'HEAD_OF_DEPARTMENT' as UserRole,
      departmentId: Object.values(createdDepartments)[i % Object.keys(createdDepartments).length].id,
      positionId: createdPositions['POS-003'].id,
      phone: generatePhone(),
      isActive: true,
    });
  }

  // Manager users
  for (let i = 1; i <= 10; i++) {
    const name = generateVietnameseName();
    users.push({
      email: generateEmail(name, i + 10),
      password: defaultPassword,
      fullName: name,
      role: 'MANAGER' as UserRole,
      departmentId: Object.values(createdDepartments)[i % Object.keys(createdDepartments).length].id,
      positionId: createdPositions['POS-005'].id,
      phone: generatePhone(),
      isActive: true,
    });
  }

  // Supervisor users
  for (let i = 1; i <= 20; i++) {
    const name = generateVietnameseName();
    const store = i % 2 === 0
      ? createdTamHaoStores[Math.floor(Math.random() * createdTamHaoStores.length)]
      : createdMaychaStores[Math.floor(Math.random() * createdMaychaStores.length)];
    users.push({
      email: generateEmail(name, i + 20),
      password: defaultPassword,
      fullName: name,
      role: 'SUPERVISOR' as UserRole,
      positionId: createdPositions['POS-006'].id,
      phone: generatePhone(),
      isActive: true,
    });
  }

  // Regular users
  for (let i = 1; i <= 50; i++) {
    const name = generateVietnameseName();
    users.push({
      email: generateEmail(name, i + 50),
      password: defaultPassword,
      fullName: name,
      role: 'USER' as UserRole,
      departmentId: Object.values(createdDepartments)[i % Object.keys(createdDepartments).length].id,
      positionId: createdPositions['POS-007'].id,
      phone: generatePhone(),
      isActive: true,
    });
  }

  const createdUsers: any[] = [];
  for (const userData of users) {
    const created = await prisma.user.create({
      data: userData,
    });
    createdUsers.push(created);
  }
  console.log(`✅ Created ${users.length} users`);

  // ============ 7. CREATE EMPLOYEES ============
  console.log('👷 Creating employees...');
  
  // Get the highest existing employee code to avoid duplicates
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: { employeeCode: 'desc' },
    select: { employeeCode: true },
  });
  
  let empCounter = 1;
  if (lastEmployee) {
    const match = lastEmployee.employeeCode.match(/EMP(\d+)/);
    if (match) {
      empCounter = parseInt(match[1], 10) + 1;
    }
  }
  
  const employees = [];

  // Create employees for each store
  for (const store of [...createdTamHaoStores.slice(0, 50), ...createdMaychaStores.slice(0, 50)]) {
    // 3-5 employees per store
    const empCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < empCount; i++) {
      const name = generateVietnameseName();
      const positions = ['POS-007', 'POS-008', 'POS-009', 'POS-010', 'POS-011', 'POS-012', 'POS-013'];
      const positionCode = positions[Math.floor(Math.random() * positions.length)];
      
      employees.push({
        employeeCode: `EMP${String(empCounter).padStart(3, '0')}`,
        fullName: name,
        email: generateEmail(name, empCounter + 1000),
        phone: generatePhone(),
        gender: Object.values(Gender)[Math.floor(Math.random() * Object.values(Gender).length)] as Gender,
        dateOfBirth: generateDateOfBirth(),
        address: generateAddress(),
        idCard: generateIdCard(),
        education: Object.values(Education)[Math.floor(Math.random() * Object.values(Education).length)] as Education,
        statusId: employeeStatusWorking,
        positionId: createdPositions[positionCode].id,
        storeId: store.id,
        brand: store.brand,
        contractTypeId: contractTypeIndefinite,
        startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        salary: Math.floor(5000000 + Math.random() * 10000000),
      });
      empCounter++;
    }
  }

  // Create office employees
  for (let i = 0; i < 100; i++) {
    const name = generateVietnameseName();
    const deptKeys = Object.keys(createdDepartments);
    const dept = createdDepartments[deptKeys[i % deptKeys.length]];
    const officePositions = ['POS-001', 'POS-002', 'POS-003', 'POS-004', 'POS-005', 'POS-006', 'POS-007'];
    const positionCode = officePositions[Math.floor(Math.random() * officePositions.length)];

    employees.push({
      employeeCode: `EMP${String(empCounter).padStart(3, '0')}`,
      fullName: name,
      email: generateEmail(name, empCounter + 2000),
      phone: generatePhone(),
      gender: Object.values(Gender)[Math.floor(Math.random() * Object.values(Gender).length)] as Gender,
      dateOfBirth: generateDateOfBirth(),
      address: generateAddress(),
      idCard: generateIdCard(),
      education: Object.values(Education)[Math.floor(Math.random() * Object.values(Education).length)] as Education,
      statusId: employeeStatusWorking,
      departmentId: dept.id,
      positionId: createdPositions[positionCode].id,
      contractTypeId: contractTypeIndefinite,
      startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      salary: Math.floor(8000000 + Math.random() * 20000000),
    });
    empCounter++;
  }

  const createdEmployees: any[] = [];
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const empData of employees) {
    try {
      const created = await prisma.employee.upsert({
        where: { employeeCode: empData.employeeCode },
        update: {}, // Don't update if exists
        create: empData,
      });
      createdEmployees.push(created);
      createdCount++;
    } catch (error: any) {
      // Skip if duplicate or other error
      if (error.code === 'P2002') {
        skippedCount++;
        // Try to find existing employee
        const existing = await prisma.employee.findUnique({
          where: { employeeCode: empData.employeeCode },
        });
        if (existing) {
          createdEmployees.push(existing);
        }
      } else {
        throw error;
      }
    }
  }
  console.log(`✅ Created ${createdCount} employees, skipped ${skippedCount} duplicates`);

  // ============ 8. CREATE REQUESTS (Đơn từ) ============
  console.log('📝 Creating requests...');
  const requests = [];
  const requestEmployees = createdEmployees.slice(0, 300); // Use first 300 employees
  
  // Get current date for realistic date ranges
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Create requests with all types
  const requestTypes = [
    { type: 'LEAVE', weight: 30, typeId: requestTypeLeave },
    { type: 'OVERTIME', weight: 20, typeId: requestTypeOvertime },
    { type: 'ABSENCE', weight: 15, typeId: requestTypeAbsence },
    { type: 'CHECKIN_CONFIRMATION', weight: 10, typeId: requestTypeCheckinConfirmation },
    { type: 'SHIFT_CHANGE', weight: 10, typeId: requestTypeShiftChange },
    { type: 'BUSINESS_TRIP', weight: 8, typeId: requestTypeBusinessTrip },
    { type: 'WORK_SCHEDULE', weight: 5, typeId: requestTypeWorkSchedule },
    { type: 'RESIGNATION', weight: 2, typeId: requestTypeResignation },
  ];
  
  // Generate weighted random type
  const getRandomType = () => {
    const totalWeight = requestTypes.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    for (const reqType of requestTypes) {
      random -= reqType.weight;
      if (random <= 0) return reqType;
    }
    return requestTypes[0];
  };

  for (let i = 0; i < 800; i++) {
    const emp = requestEmployees[Math.floor(Math.random() * requestEmployees.length)];
    const selectedType = getRandomType();
    
    // Random status (70% approved, 20% pending, 10% rejected)
    const statusRand = Math.random();
    let statusId = requestStatusPending;
    if (statusRand < 0.7) {
      statusId = requestStatusApproved;
    } else if (statusRand < 0.9) {
      statusId = requestStatusPending;
    } else {
      statusId = requestStatusRejected;
    }
    
    // Generate dates (mix of current month, past months, and future)
    const monthOffset = Math.floor(Math.random() * 6) - 2; // -2 to 3 months
    const day = Math.floor(Math.random() * 28) + 1;
    const startDate = new Date(currentYear, currentMonth + monthOffset, day);
    const endDate = new Date(startDate.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
    
    const requestData: any = {
      typeId: selectedType.typeId,
      statusId,
      employeeId: emp.id,
      departmentId: emp.departmentId,
      reason: '',
      description: '',
    };
    
    // Type-specific fields
    switch (selectedType.type) {
      case 'LEAVE':
        const leaveTypes = [leaveTypePaidLeave, leaveTypeUnpaidLeave, leaveTypeSickLeave];
        requestData.leaveTypeId = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        requestData.startDate = startDate;
        requestData.endDate = endDate;
        // leaveDays is calculated from startDate and endDate, not stored in DB
        requestData.reason = ['Nghỉ phép cá nhân', 'Nghỉ ốm', 'Nghỉ việc riêng', 'Nghỉ thai sản'][Math.floor(Math.random() * 4)];
        requestData.description = 'Nghỉ phép theo quy định';
        break;
        
      case 'OVERTIME':
        requestData.overtimeDate = startDate;
        requestData.overtimeHours = Math.floor(Math.random() * 8) + 1;
        requestData.reason = 'Tăng ca để hoàn thành dự án';
        requestData.description = 'Tăng ca cuối tuần';
        break;
        
      case 'ABSENCE':
        requestData.startDate = startDate;
        requestData.endDate = endDate;
        requestData.reason = ['Vắng mặt không phép', 'Vắng mặt có lý do'][Math.floor(Math.random() * 2)];
        requestData.description = 'Vắng mặt';
        break;
        
      case 'CHECKIN_CONFIRMATION':
        const checkInTime = new Date(startDate);
        checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        const checkOutTime = new Date(checkInTime);
        checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        requestData.checkInTime = checkInTime;
        requestData.checkOutTime = checkOutTime;
        requestData.reason = 'Xác nhận công làm việc';
        requestData.description = 'Quên check-in/out';
        break;
        
      case 'SHIFT_CHANGE':
        const shifts = ['CA_1', 'CA_2', 'CA_3'];
        requestData.fromShift = shifts[Math.floor(Math.random() * shifts.length)];
        requestData.toShift = shifts.filter(s => s !== requestData.fromShift)[Math.floor(Math.random() * 2)];
        requestData.shiftDate = startDate;
        requestData.reason = 'Đổi ca làm việc';
        requestData.description = 'Cần đổi ca do lịch cá nhân';
        break;
        
      case 'BUSINESS_TRIP':
        const locations = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Nha Trang'];
        requestData.tripLocation = locations[Math.floor(Math.random() * locations.length)];
        requestData.tripPurpose = ['Họp khách hàng', 'Đào tạo', 'Hội thảo', 'Khảo sát thị trường'][Math.floor(Math.random() * 4)];
        requestData.startDate = startDate;
        requestData.endDate = endDate;
        requestData.reason = `Công tác tại ${requestData.tripLocation}`;
        requestData.description = requestData.tripPurpose;
        break;
        
      case 'WORK_SCHEDULE':
        requestData.startDate = startDate;
        requestData.endDate = endDate;
        requestData.reason = 'Làm việc theo chế độ đặc biệt';
        requestData.description = 'Làm việc theo lịch riêng';
        break;
        
      case 'RESIGNATION':
        requestData.startDate = new Date(startDate.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        requestData.reason = ['Tìm việc mới', 'Chuyển công việc', 'Lý do cá nhân', 'Sức khỏe'][Math.floor(Math.random() * 4)];
        requestData.description = 'Đơn thôi việc';
        break;
    }
    
    // Add approver if approved/rejected
    if (statusId === requestStatusApproved || statusId === requestStatusRejected) {
      requestData.approverId = admin.id;
      requestData.approvedAt = statusId === requestStatusApproved ? new Date(startDate.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000) : undefined;
      requestData.rejectedAt = statusId === requestStatusRejected ? new Date(startDate.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000) : undefined;
      if (statusId === requestStatusRejected) {
        requestData.rejectionReason = 'Không đủ điều kiện';
      }
    }
    
    requests.push(requestData);
  }

  const createdRequests: any[] = [];
  for (const reqData of requests) {
    try {
      const created = await prisma.request.create({
        data: reqData,
      });
      createdRequests.push(created);
    } catch (err: any) {
      // Skip duplicates or errors
      console.warn(`Failed to create request: ${err.message}`);
    }
  }
  console.log(`✅ Created ${createdRequests.length} requests (${requestTypes.map(t => t.type).join(', ')})`);

  // ============ 9. CREATE CONTRACTS ============
  console.log('📄 Creating contracts...');
  const contracts = [];
  const contractEmployees = createdEmployees.slice(0, 300);

  for (const emp of contractEmployees) {
    contracts.push({
      employeeId: emp.id,
      typeId: contractTypeIndefinite,
      startDate: emp.startDate || new Date(2024, 0, 1),
      endDate: null,
      salary: emp.salary || 5000000,
      position: createdPositions[Object.keys(createdPositions)[Math.floor(Math.random() * Object.keys(createdPositions).length)]].name,
      department: emp.departmentId ? createdDepartments[Object.keys(createdDepartments).find(k => createdDepartments[k].id === emp.departmentId)!]?.name : undefined,
      statusId: contractStatusActive,
      createdById: admin.id,
    });
  }

  const createdContracts: any[] = [];
  for (const contractData of contracts) {
    const created = await prisma.contract.create({
      data: contractData,
    });
    createdContracts.push(created);
  }
  console.log(`✅ Created ${contracts.length} contracts`);

  // ============ 10. CREATE CANDIDATES ============
  console.log('👤 Creating candidates...');
  const candidates = [];
  const allStores = [...createdTamHaoStores, ...createdMaychaStores];

  for (let i = 0; i < 300; i++) {
    const name = generateVietnameseName();
    const store = allStores[Math.floor(Math.random() * allStores.length)];
    const statuses = [candidateStatusCvPassed, candidateStatusWaitingInterview, candidateStatusOnboardingAccepted];
    const statusId = statuses[Math.floor(Math.random() * statuses.length)];

    candidates.push({
      fullName: name,
      email: generateEmail(name, i + 3000),
      phone: generatePhone(),
      cvUrl: `https://example.com/cv/${i}.pdf`,
      statusId,
      brand: store.brand,
      position: 'Nhân viên phục vụ',
      storeId: store.id,
      notes: `Ứng viên ${name} ứng tuyển vị trí nhân viên`,
    });
  }

  const createdCandidates: any[] = [];
  for (const candidateData of candidates) {
    const created = await prisma.candidate.create({
      data: candidateData,
    });
    createdCandidates.push(created);
  }
  console.log(`✅ Created ${candidates.length} candidates`);

  // ============ 11. CREATE TIMEKEEPING ============
  console.log('⏰ Creating timekeeping records...');
  const timekeepingRecords = [];
  const timekeepingEmployees = createdEmployees.slice(0, 400);

  // Create records for last 3 months
  for (let month = 0; month < 3; month++) {
    const currentMonth = new Date(2024, 11 - month, 1);
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    for (const emp of timekeepingEmployees) {
      // Create records for 20-25 days per month (work days)
      const workDays = 20 + Math.floor(Math.random() * 6);
      for (let day = 1; day <= workDays && day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const checkIn = new Date(date);
        checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        const checkOut = new Date(date);
        checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        const workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

        timekeepingRecords.push({
          employeeId: emp.id,
          userId: admin.id,
          date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workHours: Math.round(workHours * 10) / 10,
          overtimeHours: workHours > 8 ? Math.round((workHours - 8) * 10) / 10 : 0,
          statusId: timekeepingStatusNormal,
        });
      }
    }
  }

  const createdTimekeeping: any[] = [];
  for (const tkData of timekeepingRecords) {
    try {
      const created = await prisma.timekeeping.create({
        data: tkData,
      });
      createdTimekeeping.push(created);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`✅ Created ${createdTimekeeping.length} timekeeping records`);

  // ============ 12. CREATE PAYROLLS ============
  console.log('💰 Creating payrolls...');
  const payrolls = [];
  const payrollEmployees = createdEmployees.slice(0, 500);

  // Create payrolls for last 3 months
  for (let month = 0; month < 3; month++) {
    const currentMonth = 12 - month;
    const year = 2024;

    for (const emp of payrollEmployees) {
      const baseSalary = Number(emp.salary) || 5000000;
      const workDays = 22;
      const workHours = workDays * 8;
      const overtimeHours = Math.floor(Math.random() * 20);
      const overtimePay = (overtimeHours * baseSalary / (workDays * 8)) * 1.5;
      const allowances = Math.floor(Math.random() * 2000000);
      const deductions = Math.floor(Math.random() * 500000);
      const grossSalary = baseSalary + overtimePay + allowances;
      const tax = grossSalary * 0.1;
      const insurance = grossSalary * 0.105;
      const netSalary = grossSalary - tax - insurance - deductions;

      payrolls.push({
        employeeId: emp.id,
        userId: admin.id,
        month: currentMonth,
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
        statusId: payrollStatusPaid,
        departmentId: emp.departmentId,
        paidAt: new Date(year, currentMonth - 1, 25),
      });
    }
  }

  const createdPayrolls: any[] = [];
  for (const payrollData of payrolls) {
    try {
      const created = await prisma.payroll.create({
        data: payrollData,
      });
      createdPayrolls.push(created);
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`✅ Created ${createdPayrolls.length} payrolls`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Departments: ${departments.length}`);
  console.log(`   - Positions: ${positions.length}`);
  console.log(`   - Tam Hảo Stores: ${tamHaoStores.length}`);
  console.log(`   - Maycha Stores: ${maychaStores.length}`);
  console.log(`   - Users: ${users.length + 1} (including admin)`);
  console.log(`   - Employees: ${employees.length}`);
  console.log(`   - Requests: ${requests.length}`);
  console.log(`   - Contracts: ${contracts.length}`);
  console.log(`   - Candidates: ${candidates.length}`);
  console.log(`   - Timekeeping Records: ${createdTimekeeping.length}`);
  console.log(`   - Payrolls: ${createdPayrolls.length}`);
  console.log('\n🔑 Login credentials:');
  console.log('   Admin: admin@maycha.com / admin123');
  console.log('   Other users: [email] / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

