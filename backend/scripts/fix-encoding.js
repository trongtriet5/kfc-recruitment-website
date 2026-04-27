const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// More comprehensive fix - convert remaining mojibake patterns  
// TRÃI appears as "TRÃI" in the output, need to check if it's actually "TRÃI" (mojibake of "TRỄI")
const additionalFixes = [
  // These stores have "TRÃI" which should be "TRÃI" - but let's verify by checking the actual bytes
];

async function comprehensiveFix() {
  await prisma.$connect();
  
  // Get all stores and check for any remaining mojibake
  const stores = await prisma.store.findMany({ take: 300 });
  
  console.log('=== CHECKING ALL STORES FOR REMAINING ISSUES ===\n');
  
  let issues = 0;
  stores.forEach(s => {
    // Check for common mojibake remnants
    if (s.name && (s.name.includes('Â') || s.name.includes('Ã') || s.name.includes('Æ') || 
        s.name.includes('¶') || s.name.includes('¢') || s.name.includes('¡') || 
        s.name.includes('¤') || s.name.includes('©'))) {
      console.log(`Issue: "${s.name}"`);
      issues++;
    }
  });
  
  console.log(`\nTotal with mojibake: ${issues}`);
  
  // Now verify with different check - look for TRÃI pattern 
  const trAiPattern = stores.filter(s => s.name && s.name.includes('TRÃI'));
  const ngAiPattern = stores.filter(s => s.name && s.name.includes('NGÃI'));
  
  console.log(`\nStores with TRÃI pattern: ${trAiPattern.length}`);
  console.log(`Stores with NGÃI pattern: ${ngAiPattern.length}`);
  
  // Show samples
  if (trAiPattern.length > 0) {
    console.log('\nTRÃI stores:');
    trAiPattern.slice(0,5).forEach(s => console.log(`  "${s.name}"`));
  }
  if (ngAiPattern.length > 0) {
    console.log('\nNGÃI stores:');
    ngAiPattern.slice(0,5).forEach(s => console.log(`  "${s.name}"`));
  }
  
  await prisma.$disconnect();
}

comprehensiveFix().catch(console.error);