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

  // Ensure attendance policy exists (needed for check-in)
  const existingPolicy = await prisma.attendancePolicy.findFirst();
  if (!existingPolicy) {
    console.log('[seed] Creating default attendance policy...');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    await prisma.attendancePolicy.create({
      data: {
        shiftStartTime: '09:00',
        gracePeriodMinutes: 15,
        allowedLatesPerWeek: 3,
        allowedLatesPerMonth: 10,
        penaltyType: 'flat',
        penaltyAmount: 100,
        penaltyPercentage: 0.05,
        isGeofencingEnabled: true,
        isPhotoRequired: true,
        enableEscalatingPenalties: true,
        escalatingTier2After: 6,
        escalatingTier2Amount: 250,
        escalatingTier3After: 10,
        escalatingTier3Amount: 500,
        updatedById: adminUser?.id || undefined,
      },
    });
    console.log('[seed] Default attendance policy created.');
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
