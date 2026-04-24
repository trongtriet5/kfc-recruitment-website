import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KFC recruitment data...');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kfcvietnam.com.vn' },
    update: {},
    create: {
      email: 'admin@kfcvietnam.com.vn',
      password: hashedPassword,
      fullName: 'Admin KFC',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created');

  // TA Users (Recruitment Executive - xử lý ứng viên)
  const taUsers = [
    { email: 'ta1@kfcvietnam.com.vn', fullName: 'Nguyễn Thị Lan TA' },
    { email: 'ta2@kfcvietnam.com.vn', fullName: 'Trần Văn Minh TA' },
    { email: 'ta3@kfcvietnam.com.vn', fullName: 'Lê Thị Hoa TA' },
  ];

  for (const ta of taUsers) {
    await prisma.user.upsert({
      where: { email: ta.email },
      update: {},
      create: {
        email: ta.email,
        password: hashedPassword,
        fullName: ta.fullName,
        role: 'TA',
        isActive: true,
      },
    });
  }
  console.log('✅ TA users created:', taUsers.length);

  // Departments
  await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { code: 'HR', name: 'Nhân sự', isActive: true },
  });
  await prisma.department.upsert({
    where: { code: 'STORE' },
    update: {},
    create: { code: 'STORE', name: 'Cửa hàng', isActive: true },
  });
  console.log('✅ Departments created');

  // Positions
  await prisma.position.upsert({
    where: { code: 'BARISTA' },
    update: {},
    create: { code: 'BARISTA', name: 'Barista', isActive: true },
  });
  await prisma.position.upsert({
    where: { code: 'CASHIER' },
    update: {},
    create: { code: 'CASHIER', name: 'Thu ngân', isActive: true },
  });
  await prisma.position.upsert({
    where: { code: 'CREW' },
    update: {},
    create: { code: 'CREW', name: 'Nhân viên', isActive: true },
  });
  console.log('✅ Positions created');

  // Stores
  const store1 = await prisma.store.upsert({
    where: { code: 'KFC_Q1' },
    update: {},
    create: { code: 'KFC_Q1', name: 'KFC Quận 1', address: '123 Nguyễn Huệ, Q1, TP.HCM', brand: 'MAYCHA' as any, isActive: true },
  });

  const store2 = await prisma.store.upsert({
    where: { code: 'KFC_Q3' },
    update: {},
    create: { code: 'KFC_Q3', name: 'KFC Quận 3', address: '456 Lê Lợi, Q3, TP.HCM', brand: 'MAYCHA' as any, isActive: true },
  });

  await prisma.store.upsert({
    where: { code: 'KFC_Q7' },
    update: {},
    create: { code: 'KFC_Q7', name: 'KFC Quận 7', address: '789 Nguyễn Văn Linh, Q7, TP.HCM', brand: 'MAYCHA' as any, isActive: true },
  });
  console.log('✅ Stores created');

  // Recruitment Forms
  const form1 = await prisma.recruitmentForm.upsert({
    where: { link: 'kfc-tuyen-dung' },
    update: {},
    create: {
      title: 'Tuyển dụng KFC 2024',
      description: 'Tuyển dụng nhân viên KFC',
      brand: 'MAYCHA' as any,
      source: 'Website',
      link: 'kfc-tuyen-dung',
      isActive: true,
    },
  });
  console.log('✅ Recruitment form created');

  // Candidates - without statusId since there's no type system
  const candidates = [
    { fullName: 'Nguyễn Thị Lan', email: 'lan@gmail.com', phone: '0911111111', formId: form1.id, brand: 'MAYCHA' as any, position: 'Barista', storeId: store1.id, notes: 'CV tốt' },
    { fullName: 'Trần Văn Minh', email: 'minh@gmail.com', phone: '0922222222', formId: form1.id, brand: 'MAYCHA' as any, position: 'Thu ngân', storeId: store2.id, notes: 'Chờ phỏng vấn' },
    { fullName: 'Lê Thị Hoa', email: 'hoa@gmail.com', phone: '0933333333', formId: form1.id, brand: 'MAYCHA' as any, position: 'Barista', storeId: store1.id, notes: 'Đã phỏng vấn' },
    { fullName: 'Phạm Văn Đức', email: 'duc@gmail.com', phone: '0944444444', formId: form1.id, brand: 'MAYCHA' as any, position: 'Nhân viên', notes: 'Đã gửi offer' },
    { fullName: 'Hoàng Thị Mai', email: 'mai@gmail.com', phone: '0955555555', formId: form1.id, brand: 'MAYCHA' as any, position: 'Barista', storeId: store2.id, notes: 'Đồng ý nhận việc' },
  ];

  for (const c of candidates) {
    await prisma.candidate.create({ data: c as any });
  }
  console.log('✅ Candidates created:', candidates.length);

  // Recruitment Proposals
  const barista = await prisma.position.findUnique({ where: { code: 'BARISTA' } });
  const cashier = await prisma.position.findUnique({ where: { code: 'CASHIER' } });

  if (barista && store1) {
    await prisma.recruitmentProposal.upsert({
      where: { id: 'proposal-1' },
      update: {},
      create: {
        id: 'proposal-1',
        title: 'Tuyển 2 Barista KFC Q1',
        description: 'Cần tuyển 2 Barista cho cửa hàng Q1',
        storeId: store1.id,
        positionId: barista.id,
        quantity: 2,
        reason: 'Mở rộng kinh doanh',
      },
    });
  }

  if (cashier && store2) {
    await prisma.recruitmentProposal.upsert({
      where: { id: 'proposal-2' },
      update: {},
      create: {
        id: 'proposal-2',
        title: 'Tuyển 1 Thu ngân KFC Q3',
        description: 'Cần tuyển 1 Thu ngân',
        storeId: store2.id,
        positionId: cashier.id,
        quantity: 1,
        reason: 'Nhân viên nghỉ việc',
      },
    });
  }
  console.log('✅ Recruitment proposals created');

  // Campaigns
  await prisma.campaign.upsert({
    where: { link: 'kfc-q1-2024' },
    update: {},
    create: {
      name: 'Tuyển dụng KFC Q1 - 2024',
      formId: form1.id,
      link: 'kfc-q1-2024',
      startDate: new Date('2024-01-01'),
      isActive: true,
    },
  });
  console.log('✅ Campaign created');

  // Headcounts
  const storeDept = await prisma.department.findUnique({ where: { code: 'STORE' } });
  if (storeDept && barista && store1) {
    await prisma.headcount.upsert({
      where: { code: 'DB2024Q1' },
      update: {},
      create: {
        code: 'DB2024Q1',
        name: 'Định biên Q1/2024',
        period: 'QUARTER' as any,
        departmentId: storeDept.id,
        storeId: store1.id,
        year: 2024,
        month: 3,
        positions: {
          create: { positionId: barista.id, current: 3, target: 5 },
        },
      },
    });
  }
  console.log('✅ Headcount created');

  console.log('🎉 KFC seed completed!');
  console.log('\n📝 Login: admin@kfcvietnam.com.vn / admin123');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });