
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, ROLE_LABELS } from '../src/recruitment/constraints';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');

  const roles = Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[];

  for (const roleCode of roles) {
    const permissions = PERMISSIONS[roleCode];
    const name = ROLE_LABELS[roleCode] || roleCode;

    await prisma.role.upsert({
      where: { code: roleCode },
      update: {
        name,
        permissions,
      },
      create: {
        code: roleCode,
        name,
        permissions,
        isSystem: true,
      },
    });
    console.log(`- Role ${roleCode} seeded.`);
  }

  // Update existing users to link to roles
  console.log('Linking users to roles...');
  const users = await prisma.user.findMany({
    where: { role: { not: null } }
  });

  for (const user of users) {
    if (user.role) {
      const role = await prisma.role.findUnique({ where: { code: user.role } });
      if (role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: role.id }
        });
      }
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
