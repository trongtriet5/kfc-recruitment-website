import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const stores = await prisma.store.findMany({ 
    take: 5,
    select: {
      id: true,
      name: true,
      code: true,
      smId: true,
      amId: true,
      amName: true
    }
  });
  console.log(JSON.stringify(stores, null, 2));
}
main().finally(() => prisma.$disconnect());
