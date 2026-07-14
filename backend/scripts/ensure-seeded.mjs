import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

  const customUser = await prisma.user.findUnique({ where: { email: 'shuhaib@123.com' } });
  if (!customUser) {
    console.log('[seed] Creating shuhaib@123.com user...');
    const hashed = await bcrypt.hash('shuhaib@123.com', 12);
    const dept = await prisma.department.findFirst();
    await prisma.user.create({
      data: {
        email: 'shuhaib@123.com',
        password: hashed,
        firstName: 'Shuhaib',
        lastName: 'Basheer',
        role: 'ADMIN',
        employeeId: 'PHEW0999',
        designation: 'Developer',
        departmentId: dept?.id || undefined,
        isActive: true,
      },
    });
    console.log('[seed] shuhaib@123.com user created.');
  }
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
