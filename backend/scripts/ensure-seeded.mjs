import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@phew.com' } });

  if (admin) {
    console.log('[seed] Admin user found — database already seeded, skipping.');
  } else {
    console.log('[seed] No admin user found — running seed...');
    execSync('npx tsx src/seed.ts', { stdio: 'inherit', cwd: '/app' });
    console.log('[seed] Database seeded successfully.');
  }
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
