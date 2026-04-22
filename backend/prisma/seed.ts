/**
 * KFC Recruitment Database Seed
 * 
 * Run: npx ts-node prisma/seed.ts
 * or: npm run prisma:seed
 * 
 * Current Database Structure:
 * - 254 Stores (from Store_KFC.xlsx)
 * - 283 Users (1 ADMIN, 28 MANAGER/AM, 254 USER/SM)
 * - 14 Positions
 * - 2 Departments
 * - 20 Candidate Statuses
 * - Vietnamese Administrative Divisions (provinces, wards, regions, units)
 */

import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

// ============ HELPER FUNCTIONS ============

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function storeEmail(code: string): string {
  const slug = code.toLowerCase().replace(/[^a-z0-9]/g, '.');
  return `sm.${slug}@kfcvietnam.com.vn`;
}

function amEmail(name: string): string {
  return `am.${toSlug(name)}@kfcvietnam.com.vn`;
}

// ============ SEED DATA ============

const candidateStatuses = [
  // Application group
  { code: 'CV_FILTERING', name: 'Lọc CV', color: '#FCD34D', group: 'application', order: 1 },
  { code: 'CV_PASSED', name: 'Ứng viên đạt', color: '#34D399', group: 'application', order: 2 },
  { code: 'CV_FAILED', name: 'Ứng viên loại', color: '#F87171', group: 'application', order: 3 },
  { code: 'BLACKLIST', name: 'Blacklist', color: '#111827', group: 'application', order: 4 },
  { code: 'CANNOT_CONTACT', name: 'Không liên hệ được', color: '#9CA3AF', group: 'application', order: 5 },
  { code: 'AREA_NOT_RECRUITING', name: 'Khu vực chưa tuyển dụng', color: '#D1D5DB', group: 'application', order: 6 },
  
  // Interview group
  { code: 'WAITING_INTERVIEW', name: 'Chờ phỏng vấn', color: '#60A5FA', group: 'interview', order: 7 },
  { code: 'HR_INTERVIEW_PASSED', name: 'HR sơ vấn đạt', color: '#059669', group: 'interview', order: 8 },
  { code: 'HR_INTERVIEW_FAILED', name: 'HR sơ vấn loại', color: '#DC2626', group: 'interview', order: 9 },
  { code: 'SM_AM_INTERVIEW_PASSED', name: 'SM/AM PV Đạt', color: '#059669', group: 'interview', order: 10 },
  { code: 'SM_AM_INTERVIEW_FAILED', name: 'SM/AM PV Loại', color: '#DC2626', group: 'interview', order: 11 },
  { code: 'OM_PV_INTERVIEW_PASSED', name: 'OM PV Đạt', color: '#059669', group: 'interview', order: 13 },
  { code: 'OM_PV_INTERVIEW_FAILED', name: 'OM PV Loại', color: '#DC2626', group: 'interview', order: 14 },
  { code: 'NO_INTERVIEW', name: 'Không đến phỏng vấn', color: '#4B5563', group: 'interview', order: 15 },
  
  // Offer group
  { code: 'OFFER_SENT', name: 'Đã gửi offer letter', color: '#818CF8', group: 'offer', order: 16 },
  { code: 'OFFER_ACCEPTED', name: 'Đồng ý offer letter', color: '#10B981', group: 'offer', order: 17 },
  { code: 'OFFER_REJECTED', name: 'Từ chối offer letter', color: '#F43F5E', group: 'offer', order: 18 },
  { code: 'WAITING_ONBOARDING', name: 'Chờ nhận việc', color: '#F97316', group: 'offer', order: 19 },
  
  // Onboarding group
  { code: 'ONBOARDING_ACCEPTED', name: 'Đồng ý nhận việc', color: '#059669', group: 'onboarding', order: 20 },
  { code: 'ONBOARDING_REJECTED', name: 'Từ chối nhận việc', color: '#B91C1C', group: 'offer', order: 21 },
];

const departments = [
  { code: 'HR', name: 'Nhân sự' },
  { code: 'STORE', name: 'Cửa hàng' },
];

const positions = [
  // Original positions
  { code: 'BARISTA', name: 'Barista' },
  { code: 'CASHIER', name: 'Thu ngân' },
  { code: 'CREW', name: 'Nhân viên' },
  // KFC positions
  { code: 'ALL_STAR', name: 'All Star' },
  { code: 'H_JUNIOR', name: 'H-Junior' },
  { code: 'H_MASTER', name: 'H-Master' },
  { code: 'H_SENIOR', name: 'H-Senior' },
  { code: 'RGM_LEVEL_1', name: 'RGM Level 1' },
  { code: 'RGM_LEVEL_2', name: 'RGM Level 2' },
  { code: 'RGM_LEVEL_3', name: 'RGM Level 3' },
  { code: 'SHIFT_SUPERVISOR', name: 'Shift Supervisor' },
  { code: 'SHIFT_SUPERVISOR_TRAINEE', name: 'Shift Supervisor Trainee' },
  { code: 'STAFF', name: 'Staff' },
  { code: 'STAR', name: 'Star' },
];

// ============ MAIN SEED FUNCTION ============

async function main() {
  console.log('🌱 Starting KFC Recruitment Database Seed...\n');

  // 1. Seed Candidate Statuses
  console.log('=== Seeding Candidate Statuses ===');
  for (const status of candidateStatuses) {
    await prisma.candidateStatus.upsert({
      where: { code: status.code },
      update: status,
      create: status,
    });
  }
  console.log(`✅ Seeded ${candidateStatuses.length} candidate statuses\n`);

  // 2. Seed Departments
  console.log('=== Seeding Departments ===');
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: { code: dept.code, name: dept.name },
    });
  }
  console.log(`✅ Seeded ${departments.length} departments\n`);

  // 3. Seed Positions
  console.log('=== Seeding Positions ===');
  for (const pos of positions) {
    await prisma.position.upsert({
      where: { code: pos.code },
      update: { name: pos.name },
      create: { code: pos.code, name: pos.name },
    });
  }
  console.log(`✅ Seeded ${positions.length} positions\n`);

  // 4. Seed Admin User (if not exists)
  console.log('=== Seeding Admin User ===');
  const adminEmail = 'admin@kfcvietnam.com.vn';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: 'kfc@123',
        fullName: 'Admin KFC',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✅ Created admin user\n');
  } else {
    console.log('✅ Admin user already exists\n');
  }

  // 5. Import Stores from Excel
  console.log('=== Importing Stores from Store_KFC.xlsx ===');
  const filePath = './Store_KFC.xlsx';
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
  const rows = raw.slice(1).filter((r: any) => r[0]);

  console.log(`📋 Found ${rows.length} stores in file\n`);

  // Import Stores
  const storeCodeToId: Record<string, string> = {};
  let storeCreated = 0, storeSkipped = 0;

  for (const row of rows) {
    const [storeName, storeId, id, am, om, od, city, zone, ic, group, group2] = row as any;
    if (!storeName || !storeId) continue;

    const code = String(storeId).trim();
    const name = String(storeName).trim();
    const cityStr = city ? String(city).trim() : '';
    const zoneStr = zone ? String(zone).trim() : '';
    const amName = am ? String(am).trim() : null;
    const omName = om ? String(om).trim() : null;
    const odName = od ? String(od).trim() : null;
    const icName = group ? String(group).trim() : null;
    const groupStr = group2 ? String(group2).trim() : null;

    const existing = await prisma.store.findUnique({ where: { code } });
    if (existing) {
      storeCodeToId[code] = existing.id;
      // Update fields if missing
      if (!existing.amName || !existing.omName || !existing.icName || !existing.group) {
        await prisma.store.update({
          where: { id: existing.id },
          data: {
            city: cityStr || existing.city,
            zone: zoneStr || existing.zone,
            amName: amName || existing.amName,
            omName: omName || existing.omName,
            odName: odName || existing.odName,
            icName: icName || existing.icName,
            group: groupStr || existing.group,
          },
        });
      }
      storeSkipped++;
      continue;
    }

    const store = await prisma.store.create({
      data: {
        name,
        code,
        address: cityStr || 'N/A',
        city: cityStr || null,
        zone: zoneStr || null,
        brand: 'KFC',
        isActive: true,
        amName,
        omName,
        odName,
        icName,
        group: groupStr,
      },
    });
    storeCodeToId[code] = store.id;
    storeCreated++;
    process.stdout.write(`  ✓ ${code} - ${name}\n`);
  }

  console.log(`\n✅ Stores: ${storeCreated} created, ${storeSkipped} already existed\n`);

  // 6. Create SM accounts (1 per store)
  console.log('=== Creating SM Accounts (1 per store) ===');
  let smCreated = 0, smSkipped = 0;

  for (const row of rows) {
    const [storeName, storeId] = row as any;
    if (!storeName || !storeId) continue;

    const code = String(storeId).trim();
    const name = String(storeName).trim();
    const email = storeEmail(code);
    const fullName = `SM - ${name}`;
    const storeDbId = storeCodeToId[code];

    try {
      let smUser = await prisma.user.findUnique({ where: { email } });
      if (!smUser) {
        smUser = await prisma.user.create({
          data: { email, password: 'kfc@123', fullName, role: 'USER', isActive: true },
        });
        smCreated++;
      } else {
        smSkipped++;
      }

      // Link SM → Store
      if (storeDbId && smUser) {
        const store = await prisma.store.findUnique({ where: { id: storeDbId } });
        if (store && !store.smId) {
          await prisma.store.update({ where: { id: storeDbId }, data: { smId: smUser.id } });
        }
      }
    } catch (err: any) {
      console.error(`  ✗ SM ${code}:`, err.message);
    }
  }

  console.log(`✅ SM accounts: ${smCreated} created, ${smSkipped} already existed\n`);

  // 7. Create AM accounts (1 per unique AM name)
  console.log('=== Creating AM Accounts ===');

  // Build AM → Stores mapping
  const amStoreMap: Record<string, string[]> = {};
  for (const row of rows) {
    const [storeName, storeId, , am] = row as any;
    if (!am || !storeId) continue;
    const amName = String(am).trim();
    const code = String(storeId).trim();
    if (!amStoreMap[amName]) amStoreMap[amName] = [];
    amStoreMap[amName].push(code);
  }

  let amCreated = 0, amSkipped = 0;

  for (const [amName, storeCodes] of Object.entries(amStoreMap)) {
    const email = amEmail(amName);

    try {
      let amUser = await prisma.user.findUnique({ where: { email } });
      if (!amUser) {
        amUser = await prisma.user.create({
          data: {
            email,
            password: 'kfc@123',
            fullName: amName,
            role: 'MANAGER',
            isActive: true,
          },
        });
        amCreated++;
      } else {
        amSkipped++;
      }

      // Link all stores managed by this AM
      for (const storeCode of storeCodes) {
        const storeDbId = storeCodeToId[storeCode];
        if (storeDbId) {
          await prisma.store.update({
            where: { id: storeDbId },
            data: { amId: amUser.id },
          });
        }
      }

      console.log(`  ✓ AM: ${amName} (${email}) — manages ${storeCodes.length} stores`);
    } catch (err: any) {
      console.error(`  ✗ AM ${amName}:`, err.message);
    }
  }

  console.log(`\n✅ AM accounts: ${amCreated} created, ${amSkipped} already existed\n`);

  // ============ SUMMARY ============
  console.log('═'.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('═'.repeat(50));
  
  const totalStores = await prisma.store.count();
  const totalUsers = await prisma.user.count();
  const totalPositions = await prisma.position.count();
  const totalDepartments = await prisma.department.count();
  const totalStatuses = await prisma.candidateStatus.count();
  
  console.log(`  Total Stores: ${totalStores}`);
  console.log(`  Total Users: ${totalUsers}`);
  console.log(`  Positions: ${totalPositions}`);
  console.log(`  Departments: ${totalDepartments}`);
  console.log(`  Candidate Statuses: ${totalStatuses}`);
  console.log('═'.repeat(50));
  console.log('\n🔑 Default password for all new accounts: kfc@123');
  console.log('   → Require password change on first login\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
