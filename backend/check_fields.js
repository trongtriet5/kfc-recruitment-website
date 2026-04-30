const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const forms = await prisma.recruitmentForm.findMany({ orderBy: { createdAt: 'desc' } });
  console.log('Total forms:', forms.length);
  
  for (const form of forms) {
    const fieldCount = await prisma.formField.count({ where: { formId: form.id } });
    console.log(`- ${form.id}: ${form.title} (${fieldCount} fields)`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);