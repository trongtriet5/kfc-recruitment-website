import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function fixUserRoleEnum() {
  console.log('🔧 Fixing UserRole enum...');

  try {
    // Step 1: Add new enum values
    console.log('📝 Adding new enum values...');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'HEAD_OF_DEPARTMENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
          ALTER TYPE "UserRole" ADD VALUE 'HEAD_OF_DEPARTMENT';
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERVISOR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
          ALTER TYPE "UserRole" ADD VALUE 'SUPERVISOR';
        END IF;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'USER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
          ALTER TYPE "UserRole" ADD VALUE 'USER';
        END IF;
      END $$;
    `);

    console.log('✅ Added new enum values');

    // Step 2: Update existing data
    console.log('🔄 Updating existing users...');
    const hrUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "users" SET role = 'HEAD_OF_DEPARTMENT' WHERE role = 'HR';
    `);
    console.log(`   Updated ${hrUpdated} HR users to HEAD_OF_DEPARTMENT`);

    const empUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "users" SET role = 'USER' WHERE role = 'EMPLOYEE';
    `);
    console.log(`   Updated ${empUpdated} EMPLOYEE users to USER`);

    console.log('✅ UserRole enum fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Run: npm run db:seed:full');
  } catch (error) {
    console.error('❌ Error fixing enum:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoleEnum();

