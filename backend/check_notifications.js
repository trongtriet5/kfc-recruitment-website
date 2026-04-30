const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update existing candidates: get source from form
  const candidates = await prisma.candidate.findMany({
    where: { sourceId: null, formId: { not: null } },
    select: { id: true, formId: true }
  });
  
  for (const candidate of candidates) {
    const form = await prisma.recruitmentForm.findUnique({
      where: { id: candidate.formId },
      select: { source: true }
    });
    
    if (form?.source) {
      const source = await prisma.source.findFirst({
        where: { 
          OR: [
            { code: { equals: form.source, mode: 'insensitive' } },
            { name: { equals: form.source, mode: 'insensitive' } }
          ]
        }
      });
      
      if (source) {
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: { sourceId: source.id }
        });
        console.log(`Updated candidate ${candidate.id} with source ${source.code}`);
      }
    }
  }
  
  console.log(`Updated ${candidates.length} candidates`);
  await prisma.$disconnect();
}

main().catch(console.error);