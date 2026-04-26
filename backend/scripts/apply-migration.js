const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'fix_missing_columns', 'migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL into individual statements, handling DO $$ blocks carefully
  const statements = [];
  let current = '';
  let inDollarBlock = false;
  let dollarTag = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChars = sql.slice(i, i + 10);

    if (!inDollarBlock && nextChars.match(/^\$\$\s*BEGIN/i)) {
      inDollarBlock = true;
      dollarTag = '$$';
      current += char;
      continue;
    }

    if (inDollarBlock && nextChars.startsWith('$$;')) {
      inDollarBlock = false;
      current += '$$';
      i += 1; // skip the second $
      statements.push(current.trim());
      current = '';
      continue;
    }

    if (!inDollarBlock && char === ';') {
      current += char;
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  // Add any remaining statement
  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  console.log(`Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`✅ [${i + 1}/${statements.length}] Executed: ${stmt.substring(0, 60).replace(/\n/g, ' ')}...`);
    } catch (error) {
      // Ignore "already exists" errors
      if (error.message.includes('already exists') || error.message.includes('Duplicate column')) {
        console.log(`⚠️  [${i + 1}/${statements.length}] Skipped (already exists): ${stmt.substring(0, 60).replace(/\n/g, ' ')}...`);
      } else {
        console.error(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
        console.error(`   Statement: ${stmt.substring(0, 100)}...`);
      }
    }
  }

  console.log('\n✅ Migration applied successfully!');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

