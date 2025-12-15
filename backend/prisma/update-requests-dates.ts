import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating request dates to current month...');

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Get all requests
  const requests = await prisma.request.findMany({
    include: {
      type: true,
      status: true,
    },
  });

  console.log(`Found ${requests.length} requests`);

  // Get type IDs
  const requestTypeLeave = await prisma.type.findFirst({
    where: {
      category: { code: 'REQUEST_TYPE' },
      code: 'LEAVE',
    },
  });

  const requestTypeOvertime = await prisma.type.findFirst({
    where: {
      category: { code: 'REQUEST_TYPE' },
      code: 'OVERTIME',
    },
  });

  const requestStatusApproved = await prisma.type.findFirst({
    where: {
      category: { code: 'REQUEST_STATUS' },
      code: 'APPROVED',
    },
  });

  const requestStatusPending = await prisma.type.findFirst({
    where: {
      category: { code: 'REQUEST_STATUS' },
      code: 'PENDING',
    },
  });

  if (!requestTypeLeave || !requestTypeOvertime || !requestStatusApproved || !requestStatusPending) {
    console.error('❌ Missing required types');
    return;
  }

  // Update each request to current month
  for (const request of requests) {
    const typeCode = request.type?.code;
    
    if (typeCode === 'LEAVE' && request.startDate && request.endDate) {
      const oldStartDate = new Date(request.startDate);
      const oldEndDate = new Date(request.endDate);
      const daysDiff = Math.floor((oldEndDate.getTime() - oldStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const newStartDate = new Date(currentYear, currentMonth - 1, 5);
      const newEndDate = new Date(currentYear, currentMonth - 1, 5 + daysDiff);
      
      await prisma.request.update({
        where: { id: request.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
          approvedAt: request.statusId === requestStatusApproved.id 
            ? new Date(currentYear, currentMonth - 1, 1)
            : null,
        },
      });
      
      console.log(`✅ Updated leave request ${request.id}: ${oldStartDate.toISOString()} -> ${newStartDate.toISOString()}`);
    } else if (typeCode === 'OVERTIME' && request.overtimeDate) {
      const oldOvertimeDate = new Date(request.overtimeDate);
      const newOvertimeDate = new Date(currentYear, currentMonth - 1, 10);
      
      await prisma.request.update({
        where: { id: request.id },
        data: {
          overtimeDate: newOvertimeDate,
          approvedAt: request.statusId === requestStatusApproved.id
            ? new Date(currentYear, currentMonth - 1, 9)
            : null,
        },
      });
      
      console.log(`✅ Updated overtime request ${request.id}: ${oldOvertimeDate.toISOString()} -> ${newOvertimeDate.toISOString()}`);
    }
  }

  console.log('✅ All requests updated to current month');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

