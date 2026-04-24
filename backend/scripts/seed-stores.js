/**
 * Seed script: Import KFC stores and user accounts from Store_KFC.xlsx
 * 
 * Usage: node scripts/seed-stores.js
 * 
 * What this does:
 *  1. Import 254 stores (name, code, city, zone, brand=KFC)
 *  2. Create 1 SM account per store  (email: sm.<storeCode>@kfcvietnam.com.vn, role: USER)
 *  3. Create 1 AM account per unique AM name (email: am.<slug>@kfcvietnam.com.vn, role: ADMIN)
 */

const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// ── helpers ────────────────────────────────────────────────────────────────
function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function storeEmail(code) {
  const slug = code.toLowerCase().replace(/[^a-z0-9]/g, '.');
  return `sm.${slug}@kfcvietnam.com.vn`;
}

function amEmail(name) {
  return `am.${toSlug(name)}@kfcvietnam.com.vn`;
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  const filePath = path.resolve(__dirname, '..', '..', 'Store_KFC.xlsx');
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });

  // header row: StoreName StoreID ID AM OM OD City Zone IC Group Group2
  const rows = raw.slice(1).filter(r => r[0]); // skip header, skip empty rows

  console.log(`📋 Found ${rows.length} stores in file\n`);

  // ── STEP 1: import stores ─────────────────────────────────────────────
  console.log('=== STEP 1: Importing stores ===');
  let storeCreated = 0, storeSkipped = 0;

  const storeCodeToId = {}; // storeCode -> DB id  (for SM account linking)

  for (const row of rows) {
    const [storeName, storeId, id, am, om, od, city, zone, ic, group, group2] = row;
    if (!storeName || !storeId) continue;

    const code = String(storeId).trim();
    const name = String(storeName).trim();
    const cityStr = city ? String(city).trim() : '';
    const zoneStr = zone ? String(zone).trim() : '';
    const address = cityStr;
    const amName = am ? String(am).trim() : null;
    const omName = om ? String(om).trim() : null;
    const odName = od ? String(od).trim() : null;
    const taIncharge = group ? String(group).trim() : null;
    const groupStr = group2 ? String(group2).trim() : null;

    try {
      const existing = await prisma.store.findUnique({ where: { code } });
      if (existing) {
        storeCodeToId[code] = existing.id;
        // Update city/zone if missing
        if (!existing.city || !existing.zone) {
          await prisma.store.update({ where: { id: existing.id }, data: { city: cityStr || undefined, zone: zoneStr || undefined } });
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
          taIncharge,
          group: groupStr,
        }
      });
      storeCodeToId[code] = store.id;
      storeCreated++;
      process.stdout.write(`  ✓ ${code} - ${name}\n`);
    } catch (err) {
      console.error(`  ✗ Failed ${code}:`, err.message);
    }
  }

  console.log(`\n✅ Stores: ${storeCreated} created, ${storeSkipped} already existed\n`);

  // ── STEP 2: SM accounts (1 per store) ────────────────────────────────
  console.log('=== STEP 2: Creating SM accounts (1 per store) & linking to store ===');
  let smCreated = 0, smSkipped = 0;

  for (const row of rows) {
    const [storeName, storeId] = row;
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
          data: { email, password: 'kfc@123', fullName, role: 'USER', isActive: true }
        });
        smCreated++;
      } else {
        smSkipped++;
      }

      // Link SM → Store (smId)
      if (storeDbId && smUser) {
        const store = await prisma.store.findUnique({ where: { id: storeDbId } });
        if (store && !store.smId) {
          await prisma.store.update({ where: { id: storeDbId }, data: { smId: smUser.id } });
        }
      }
    } catch (err) {
      console.error(`  ✗ SM ${code}:`, err.message);
    }
  }

  console.log(`✅ SM accounts: ${smCreated} created, ${smSkipped} already existed\n`);

  // ── STEP 3: AM accounts (1 per unique AM name) ───────────────────────
  console.log('=== STEP 3: Creating AM accounts ===');

  // Build Map: amName -> [storeCode, ...]
  const amStoreMap = {};
  for (const row of rows) {
    const [storeName, storeId, , am] = row;
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
          }
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
            data: { amId: amUser.id }
          });
        }
      }

      console.log(`  ✓ AM: ${amName} (${email}) — manages ${storeCodes.length} stores`);
    } catch (err) {
      console.error(`  ✗ AM ${amName}:`, err.message);
    }
  }

  console.log(`\n✅ AM accounts: ${amCreated} created, ${amSkipped} already existed`);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('═'.repeat(50));
  console.log(`  Stores  : ${storeCreated} mới / ${storeSkipped} đã tồn tại`);
  console.log(`  SM accs : ${smCreated} mới / ${smSkipped} đã tồn tại`);
  console.log(`  AM accs : ${amCreated} mới / ${amSkipped} đã tồn tại`);
  console.log('═'.repeat(50));
  console.log('\n🔑 Default password cho tất cả tài khoản mới: kfc@123');
  console.log('   → Yêu cầu người dùng đổi mật khẩu sau lần đăng nhập đầu tiên\n');

  // Print out AM store mapping summary
  console.log('\n📋 AM - STORE MAPPING:');
  for (const [amName, storeCodes] of Object.entries(amStoreMap)) {
    console.log(`  ${amName} → ${storeCodes.join(', ')}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
