import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'shuhaib@123.com' } });
  if (existing) {
    console.log('User shuhaib@123.com already exists.');
    return;
  }

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

  console.log('User shuhaib@123.com created successfully.');
}

main()
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
