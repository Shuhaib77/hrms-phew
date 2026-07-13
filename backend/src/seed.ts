import { PrismaClient, Role, LeaveType, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashed = await bcrypt.hash('Admin@123', 12);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.employeeOfTheMonth.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.payslipComponent.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.salaryComponent.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.attendancePolicy.deleteMany();
  await prisma.employeeLocationAssignment.deleteMany();
  await prisma.location.deleteMany();
  await prisma.department.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();

  // Departments
  const deptEngineering = await prisma.department.create({
    data: { name: 'Engineering', code: 'ENG' },
  });
  const deptDesign = await prisma.department.create({
    data: { name: 'Design', code: 'DES' },
  });
  const deptMarketing = await prisma.department.create({
    data: { name: 'Marketing', code: 'MKT' },
  });
  const deptHR = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR' },
  });
  const deptFinance = await prisma.department.create({
    data: { name: 'Finance & Accounts', code: 'FIN' },
  });

  // Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@phew.com',
      password: hashed,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      employeeId: 'PHEW0001',
      designation: 'System Administrator',
      departmentId: deptEngineering.id,
      isActive: true,
    },
  });

  const hrManager = await prisma.user.create({
    data: {
      email: 'hr@phew.com',
      password: hashed,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'HR_MANAGER',
      employeeId: 'PHEW0002',
      designation: 'HR Manager',
      departmentId: deptHR.id,
      isActive: true,
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      email: 'alice@phew.com',
      password: hashed,
      firstName: 'Alice',
      lastName: 'Williams',
      role: 'MANAGER',
      employeeId: 'PHEW0003',
      designation: 'Engineering Manager',
      departmentId: deptEngineering.id,
      isActive: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'bob@phew.com',
      password: hashed,
      firstName: 'Bob',
      lastName: 'Chen',
      role: 'MANAGER',
      employeeId: 'PHEW0004',
      designation: 'Design Lead',
      departmentId: deptDesign.id,
      isActive: true,
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      email: 'john@phew.com',
      password: hashed,
      firstName: 'John',
      lastName: 'Doe',
      role: 'EMPLOYEE',
      employeeId: 'PHEW0005',
      designation: 'Senior Software Engineer',
      departmentId: deptEngineering.id,
      managerId: manager1.id,
      dateOfJoining: new Date('2022-03-15'),
      dateOfBirth: new Date('1992-07-22'),
      phone: '+1-555-0101',
      address: '123 Main St, San Francisco, CA',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+1-555-0102',
      isActive: true,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: 'jane@phew.com',
      password: hashed,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'EMPLOYEE',
      employeeId: 'PHEW0006',
      designation: 'Software Engineer',
      departmentId: deptEngineering.id,
      managerId: manager1.id,
      dateOfJoining: new Date('2023-06-01'),
      dateOfBirth: new Date('1995-11-15'),
      isActive: true,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      email: 'mike@phew.com',
      password: hashed,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'EMPLOYEE',
      employeeId: 'PHEW0007',
      designation: 'UI/UX Designer',
      departmentId: deptDesign.id,
      managerId: manager2.id,
      dateOfJoining: new Date('2023-09-10'),
      dateOfBirth: new Date('1993-04-08'),
      isActive: true,
    },
  });

  const emp4 = await prisma.user.create({
    data: {
      email: 'emma@phew.com',
      password: hashed,
      firstName: 'Emma',
      lastName: 'Brown',
      role: 'EMPLOYEE',
      employeeId: 'PHEW0008',
      designation: 'Marketing Specialist',
      departmentId: deptMarketing.id,
      dateOfJoining: new Date('2024-01-20'),
      dateOfBirth: new Date('1996-09-12'),
      isActive: true,
    },
  });

  const emp5 = await prisma.user.create({
    data: {
      email: 'david@phew.com',
      password: hashed,
      firstName: 'David',
      lastName: 'Wilson',
      role: 'EMPLOYEE',
      employeeId: 'PHEW0009',
      designation: 'DevOps Engineer',
      departmentId: deptEngineering.id,
      managerId: manager1.id,
      dateOfJoining: new Date('2022-11-01'),
      dateOfBirth: new Date('1991-03-25'),
      isActive: true,
    },
  });

  const emp6 = await prisma.user.create({
    data: {
      email: 'sophia@phew.com',
      password: hashed,
      firstName: 'Sophia',
      lastName: 'Lee',
      role: 'EMPLOYEE',
      employeeId: 'PHEW0010',
      designation: 'Software Engineer',
      departmentId: deptEngineering.id,
      managerId: manager1.id,
      dateOfJoining: new Date('2024-04-01'),
      dateOfBirth: new Date('1997-08-18'),
      isActive: true,
    },
  });

  const emp7 = await prisma.user.create({
    data: {
      email: 'oliver@phew.com',
      password: hashed,
      firstName: 'Oliver',
      lastName: 'Taylor',
      role: 'EMPLOYEE',
      employeeId: 'PHEW0011',
      designation: 'Graphic Designer',
      departmentId: deptDesign.id,
      managerId: manager2.id,
      dateOfJoining: new Date('2023-02-14'),
      dateOfBirth: new Date('1994-12-01'),
      isActive: true,
    },
  });

  // Set department heads
  await prisma.department.update({
    where: { id: deptEngineering.id },
    data: { headId: manager1.id },
  });
  await prisma.department.update({
    where: { id: deptDesign.id },
    data: { headId: manager2.id },
  });
  await prisma.department.update({
    where: { id: deptHR.id },
    data: { headId: hrManager.id },
  });

  // Locations
  const hqLocation = await prisma.location.create({
    data: {
      name: 'Head Office',
      address: '100 Innovation Drive, San Francisco, CA 94105',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 200,
      isActive: true,
    },
  });

  const branchLocation = await prisma.location.create({
    data: {
      name: 'Downtown Branch',
      address: '50 Market Street, San Francisco, CA 94105',
      latitude: 37.7949,
      longitude: -122.3994,
      radius: 150,
      isActive: true,
    },
  });

  const remoteHub = await prisma.location.create({
    data: {
      name: 'Remote Hub - NYC',
      address: '200 Park Avenue, New York, NY 10166',
      latitude: 40.7549,
      longitude: -73.9840,
      radius: 300,
      isActive: true,
    },
  });

  // Assign employees to locations
  const allEmployees = [emp1, emp2, emp3, emp4, emp5, emp6, emp7];
  for (const emp of allEmployees) {
    await prisma.employeeLocationAssignment.create({
      data: { userId: emp.id, locationId: hqLocation.id },
    });
  }
  await prisma.employeeLocationAssignment.create({
    data: { userId: emp5.id, locationId: remoteHub.id },
  });

  // Attendance Policy
  const policy = await prisma.attendancePolicy.create({
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
    },
  });

  // Sample Attendance Records (last 30 days)
  const today = new Date();
  const statuses: AttendanceStatus[] = ['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'REJECTED'];

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const emp of allEmployees) {
      const status = emp === emp3 && dayOffset === 2 ? 'REJECTED' as AttendanceStatus
        : emp === emp5 && dayOffset === 5 ? 'REJECTED' as AttendanceStatus
        : statuses[Math.floor(Math.random() * statuses.length)];

      const checkInHour = 8 + Math.floor(Math.random() * 3);
      const checkInMin = Math.floor(Math.random() * 60);
      const checkInDate = new Date(date);
      checkInDate.setHours(checkInHour, checkInMin, 0, 0);

      const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMin > 15);

      await prisma.attendance.create({
        data: {
          userId: emp.id,
          type: 'CHECK_IN',
          timestamp: checkInDate,
          date: date,
          latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
          locationId: hqLocation.id,
          status,
          isLate,
          lateMinutes: isLate ? (checkInHour - 9) * 60 + checkInMin - 15 : 0,
          rejectionReason: status === 'REJECTED' ? 'Outside geofence area' : null,
        },
      });

      const checkoutHour = 17 + Math.floor(Math.random() * 2);
      const checkoutDate = new Date(date);
      checkoutDate.setHours(checkoutHour, Math.floor(Math.random() * 60), 0, 0);

      await prisma.attendance.create({
        data: {
          userId: emp.id,
          type: 'CHECK_OUT',
          timestamp: checkoutDate,
          date: date,
          latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
          locationId: hqLocation.id,
          status: 'APPROVED',
        },
      });
    }
  }

  // Leave Balances
  const leaveTypes: LeaveType[] = ['SICK', 'CASUAL', 'PAID', 'UNPAID', 'OPTIONAL'];
  const leaveDefaults: Record<string, number> = {
    SICK: 12, CASUAL: 12, PAID: 18, UNPAID: 0, OPTIONAL: 3,
  };

  for (const emp of allEmployees) {
    for (const type of leaveTypes) {
      const used = type === 'CASUAL' ? 3 : type === 'PAID' ? 5 : type === 'SICK' ? 2 : 0;
      await prisma.leaveBalance.create({
        data: {
          userId: emp.id,
          type,
          total: leaveDefaults[type],
          used,
          year: currentYear,
        },
      });
    }
  }

  // Leave Requests
  const leaveStart = new Date(today);
  leaveStart.setDate(leaveStart.getDate() + 5);
  const leaveEnd = new Date(leaveStart);
  leaveEnd.setDate(leaveEnd.getDate() + 2);

  await prisma.leaveRequest.create({
    data: {
      userId: emp1.id,
      type: 'CASUAL',
      status: 'APPROVED',
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: 'Family event',
      approverId: manager1.id,
    },
  });

  const pastLeaveStart = new Date(today);
  pastLeaveStart.setDate(pastLeaveStart.getDate() - 15);
  const pastLeaveEnd = new Date(pastLeaveStart);
  pastLeaveEnd.setDate(pastLeaveEnd.getDate() + 1);

  await prisma.leaveRequest.create({
    data: {
      userId: emp2.id,
      type: 'SICK',
      status: 'APPROVED',
      startDate: pastLeaveStart,
      endDate: pastLeaveEnd,
      reason: 'Medical appointment',
      approverId: manager1.id,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: emp4.id,
      type: 'PAID',
      status: 'PENDING',
      startDate: new Date(today.getFullYear(), today.getMonth() + 1, 10),
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 14),
      reason: 'Vacation',
    },
  });

  // Holidays
  const holidays = [
    { name: "New Year's Day", date: new Date(currentYear, 0, 1), type: 'public' },
    { name: 'Republic Day', date: new Date(currentYear, 0, 26), type: 'public' },
    { name: 'Independence Day', date: new Date(currentYear, 6, 4), type: 'public' },
    { name: 'Labor Day', date: new Date(currentYear, 4, 1), type: 'public' },
    { name: 'Thanksgiving', date: new Date(currentYear, 10, 27), type: 'public' },
    { name: 'Christmas', date: new Date(currentYear, 11, 25), type: 'public' },
    { name: 'Company Foundation Day', date: new Date(currentYear, 2, 15), type: 'company' },
  ];

  for (const h of holidays) {
    await prisma.holiday.create({ data: h });
  }

  if (currentMonth <= 11) {
    await prisma.holiday.create({
      data: { name: 'Diwali / Festival of Lights', date: new Date(currentYear, 10, 1), type: 'optional' },
    });
  }

  // Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Corp',
      email: 'contact@acmecorp.com',
      phone: '+1-555-1000',
      address: '1 Acme Plaza, New York, NY',
      isActive: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'TechNova Inc',
      email: 'hello@technova.io',
      phone: '+1-555-2000',
      address: '500 Tech Park, Austin, TX',
      isActive: true,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'GreenLeaf Solutions',
      email: 'info@greenleaf.com',
      phone: '+1-555-3000',
      isActive: true,
    },
  });

  // Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Platform Redesign',
      description: 'Complete redesign of the client\'s e-commerce platform with modern UI/UX',
      status: 'DELIVERED',
      clientId: client1.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      deliveredAt: new Date('2024-06-28'),
      deliveredById: manager1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Cross-platform mobile application for inventory management',
      status: 'ACTIVE',
      clientId: client2.id,
      startDate: new Date('2024-07-01'),
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Dashboard Analytics Suite',
      description: 'Real-time analytics dashboard with interactive charts and reports',
      status: 'DELIVERED',
      clientId: client3.id,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-15'),
      deliveredAt: new Date('2024-08-10'),
      deliveredById: manager2.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: 'CRM Integration Module',
      description: 'Custom CRM integration with existing enterprise systems',
      status: 'ACTIVE',
      clientId: client1.id,
      startDate: new Date('2024-09-01'),
    },
  });

  // Project Members
  const projectMembers = [
    { projectId: project1.id, userId: emp1.id, role: 'Tech Lead' },
    { projectId: project1.id, userId: emp2.id, role: 'Developer' },
    { projectId: project1.id, userId: emp3.id, role: 'UI Designer' },
    { projectId: project1.id, userId: emp5.id, role: 'DevOps' },
    { projectId: project2.id, userId: emp1.id, role: 'Developer' },
    { projectId: project2.id, userId: emp6.id, role: 'Developer' },
    { projectId: project2.id, userId: emp3.id, role: 'Designer' },
    { projectId: project3.id, userId: emp7.id, role: 'Lead Designer' },
    { projectId: project3.id, userId: emp2.id, role: 'Developer' },
    { projectId: project3.id, userId: emp5.id, role: 'Data Engineer' },
    { projectId: project4.id, userId: emp1.id, role: 'Architect' },
    { projectId: project4.id, userId: emp6.id, role: 'Developer' },
    { projectId: project4.id, userId: emp7.id, role: 'Designer' },
  ];

  for (const pm of projectMembers) {
    await prisma.projectMember.create({ data: pm });
  }

  // Tasks
  const tasks = [
    { title: 'Design system component library', projectId: project1.id, assignees: [emp3.id, emp7.id] },
    { title: 'Implement shopping cart API', projectId: project1.id, assignees: [emp1.id] },
    { title: 'Payment gateway integration', projectId: project1.id, assignees: [emp1.id, emp2.id] },
    { title: 'User authentication flow', projectId: project1.id, assignees: [emp2.id] },
    { title: 'Mobile splash screen & onboarding', projectId: project2.id, assignees: [emp3.id] },
    { title: 'Inventory API endpoints', projectId: project2.id, assignees: [emp1.id, emp6.id] },
    { title: 'Push notification service', projectId: project2.id, assignees: [emp6.id] },
    { title: 'Real-time data pipeline', projectId: project3.id, assignees: [emp5.id] },
    { title: 'Chart components with Recharts', projectId: project3.id, assignees: [emp2.id] },
    { title: 'Dashboard widget framework', projectId: project3.id, assignees: [emp7.id] },
    { title: 'Database schema design', projectId: project4.id, assignees: [emp1.id] },
    { title: 'API integration layer', projectId: project4.id, assignees: [emp6.id] },
  ];

  const taskStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
  const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

  for (const t of tasks) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: `Task: ${t.title}`,
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
        priority: taskPriorities[Math.floor(Math.random() * taskPriorities.length)],
        projectId: t.projectId,
        createdById: manager1.id,
        dueDate: new Date(today.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });

    for (const assigneeId of t.assignees) {
      await prisma.taskAssignee.create({
        data: { taskId: task.id, userId: assigneeId },
      });
    }
  }

  // Performance Reviews
  const reviewCycles = ['Q1-2024', 'Q2-2024', 'Q3-2024'];
  const employeesForReview = [
    { userId: emp1.id, reviewerId: manager1.id, scores: [9, 8, 9, 9] },
    { userId: emp2.id, reviewerId: manager1.id, scores: [8, 7, 8, 7] },
    { userId: emp5.id, reviewerId: manager1.id, scores: [7, 8, 7, 8] },
    { userId: emp6.id, reviewerId: manager1.id, scores: [8, 9, 8, 9] },
    { userId: emp3.id, reviewerId: manager2.id, scores: [9, 9, 8, 8] },
    { userId: emp7.id, reviewerId: manager2.id, scores: [7, 7, 8, 8] },
  ];

  for (const rev of employeesForReview) {
    for (const cycle of reviewCycles) {
      const [quality, timeliness, collaboration, ownership] = rev.scores;
      const overallScore = (quality + timeliness + collaboration + ownership) / 4;
      await prisma.performanceReview.create({
        data: {
          userId: rev.userId,
          reviewerId: rev.reviewerId,
          cycle,
          quality,
          timeliness,
          collaboration,
          ownership,
          overallScore,
          feedback: `Good performance in ${cycle}. Keep up the great work!`,
        },
      });
    }
  }

  // Employee of the Month - current
  await prisma.employeeOfTheMonth.create({
    data: {
      userId: emp1.id,
      month: currentMonth,
      year: currentYear,
      reason: 'Exceptional performance on E-Commerce Platform Redesign project. Led the team to deliver ahead of schedule with zero critical bugs. Demonstrated outstanding technical leadership and collaboration.',
      selectedById: admin.id,
      isActive: true,
    },
  });

  // Past EOMs
  const pastMonths = [
    { userId: emp3.id, month: currentMonth > 1 ? currentMonth - 1 : 12, year: currentMonth > 1 ? currentYear : currentYear - 1, reason: 'Outstanding UI/UX designs that exceeded client expectations' },
    { userId: emp5.id, month: currentMonth > 2 ? currentMonth - 2 : 11, year: currentMonth > 2 ? currentYear : currentYear - 1, reason: 'Critical infrastructure improvements and 99.9% uptime achievement' },
  ];

  for (const pm of pastMonths) {
    await prisma.employeeOfTheMonth.create({
      data: {
        userId: pm.userId,
        month: pm.month,
        year: pm.year,
        reason: pm.reason,
        selectedById: admin.id,
        isActive: true,
      },
    });
  }

  // Salary Structures
  const salaryStructures = [
    { userId: admin.id, basic: 150000, hra: 75000, allowances: { Travel: 5000, Internet: 3000, Medical: 2000 }, deductions: { PF: 12000, Tax: 25000, Insurance: 3000 } },
    { userId: hrManager.id, basic: 90000, hra: 45000, allowances: { Travel: 4000, Internet: 2000, Medical: 1500 }, deductions: { PF: 8000, Tax: 15000, Insurance: 2000 } },
    { userId: manager1.id, basic: 120000, hra: 60000, allowances: { Travel: 5000, Internet: 3000, Medical: 2000 }, deductions: { PF: 10000, Tax: 20000, Insurance: 2500 } },
    { userId: manager2.id, basic: 110000, hra: 55000, allowances: { Travel: 5000, Internet: 3000, Medical: 2000 }, deductions: { PF: 9500, Tax: 18000, Insurance: 2500 } },
    { userId: emp1.id, basic: 80000, hra: 40000, allowances: { Travel: 3000, Internet: 2000, Medical: 1500 }, deductions: { PF: 6000, Tax: 12000, Insurance: 1500 } },
    { userId: emp2.id, basic: 60000, hra: 30000, allowances: { Travel: 2000, Internet: 1500, Medical: 1000 }, deductions: { PF: 5000, Tax: 8000, Insurance: 1000 } },
    { userId: emp3.id, basic: 65000, hra: 32500, allowances: { Travel: 2000, Internet: 1500, Medical: 1000 }, deductions: { PF: 5000, Tax: 9000, Insurance: 1000 } },
    { userId: emp4.id, basic: 50000, hra: 25000, allowances: { Travel: 2000, Internet: 1000, Medical: 1000 }, deductions: { PF: 4000, Tax: 6000, Insurance: 800 } },
    { userId: emp5.id, basic: 85000, hra: 42500, allowances: { Travel: 3000, Internet: 2000, Medical: 1500 }, deductions: { PF: 6500, Tax: 13000, Insurance: 1500 } },
    { userId: emp6.id, basic: 55000, hra: 27500, allowances: { Travel: 2000, Internet: 1500, Medical: 1000 }, deductions: { PF: 4500, Tax: 7000, Insurance: 1000 } },
    { userId: emp7.id, basic: 55000, hra: 27500, allowances: { Travel: 2000, Internet: 1500, Medical: 1000 }, deductions: { PF: 4500, Tax: 7000, Insurance: 1000 } },
  ];

  for (const ss of salaryStructures) {
    await prisma.salaryStructure.create({
      data: {
        userId: ss.userId,
        effectiveFrom: new Date('2024-01-01'),
        basic: ss.basic,
        hra: ss.hra,
        allowances: ss.allowances,
        deductions: ss.deductions,
        monthlyGross: ss.basic + ss.hra + Object.values(ss.allowances).reduce((a: number, b: number) => a + b, 0),
        monthlyNet: ss.basic + ss.hra + Object.values(ss.allowances).reduce((a: number, b: number) => a + b, 0) - Object.values(ss.deductions).reduce((a: number, b: number) => a + b, 0),
      },
    });
  }

  // Sample Payslips (last 3 months)
  for (let offset = 0; offset < 3; offset++) {
    const m = currentMonth - 1 - offset;
    const y = m <= 0 ? currentYear - 1 : currentYear;
    const month = m <= 0 ? m + 12 : m;

    for (const ss of salaryStructures) {
      const hasPenalty = ss.userId === emp1.id && offset === 0;
      const deductionsTotal = Object.values(ss.deductions).reduce((a: number, b: number) => a + b, 0);
      const allowancesTotal = Object.values(ss.allowances).reduce((a: number, b: number) => a + b, 0);
      const penaltyAmount = hasPenalty ? 200 : 0;
      const grossPay = ss.basic + ss.hra + allowancesTotal;
      const totalDeductions = deductionsTotal + penaltyAmount;
      const netPay = grossPay - totalDeductions;

      const payslip = await prisma.payslip.create({
        data: {
          userId: ss.userId,
          month,
          year: y,
          basic: ss.basic,
          hra: ss.hra,
          allowances: ss.allowances,
          deductions: ss.deductions,
          additionalDeductions: hasPenalty ? [{ reason: 'Late check-in penalty (2 occurrences)', amount: 200 }] : [],
          grossPay,
          totalDeductions,
          netPay,
          status: offset === 0 ? 'DRAFT' : 'FINALIZED',
          isLocked: offset !== 0,
          generatedById: admin.id,
          latePenalties: hasPenalty ? [{ date: new Date(y, month - 1, 15), lateMinutes: 25, amount: 200 }] : [],
        },
      });

    }
  }

  // Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Phew HRMS!',
      content: 'We are excited to launch our new HR Management System. This platform will streamline attendance tracking, leave management, payroll, and performance reviews. Please explore the features and reach out to HR with any questions.',
      authorId: admin.id,
      priority: 'high',
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Q3 All-Hands Meeting',
      content: 'Quarterly all-hands meeting scheduled for next Friday at 3 PM in the main conference room. Refreshments will be provided.',
      authorId: hrManager.id,
      priority: 'normal',
      expiresAt: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Notifications for EOM
  await prisma.notification.create({
    data: {
      userId: emp1.id,
      type: 'EOM_SELECTED',
      title: 'Employee of the Month',
      message: `Congratulations! You have been selected as Employee of the Month for ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][currentMonth - 1]} ${currentYear}`,
      link: '/performance/eom',
    },
  });

  console.log('Seed completed successfully!');
  console.log(`  Users: ${allEmployees.length + 4} (${allEmployees.length} employees + admin/hr/managers)`);
  console.log(`  Departments: 5`);
  console.log(`  Locations: 3`);
  console.log(`  Attendance records: seeded for last 30 days`);
  console.log(`  Leave balances: created for all employees`);
  console.log(`  Holidays: ${holidays.length} seeded`);
  console.log(`  Clients: 3`);
  console.log(`  Projects: 4`);
  console.log(`  Performance Reviews: ${employeesForReview.length * reviewCycles.length}`);
  console.log(`  Payslips: ${salaryStructures.length * 3}`);
  console.log(`\nLogin credentials:`);
  console.log(`  Admin: admin@phew.com / Admin@123`);
  console.log(`  HR: hr@phew.com / Admin@123`);
  console.log(`  Manager: alice@phew.com / Admin@123`);
  console.log(`  Employee: john@phew.com / Admin@123`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
