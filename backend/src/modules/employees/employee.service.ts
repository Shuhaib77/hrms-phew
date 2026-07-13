import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';

export class EmployeeService {
  async list(filters: {
    departmentId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Prisma.UserWhereInput = {};
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.role) where.role = filters.role as any;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (filters.sortBy === 'firstName' || filters.sortBy === 'lastName' || filters.sortBy === 'email' || filters.sortBy === 'employeeId' || filters.sortBy === 'createdAt') {
      (orderBy as any)[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = filters.sortOrder || 'desc';
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          employeeId: true,
          designation: true,
          departmentId: true,
          department: { select: { id: true, name: true } },
          managerId: true,
          manager: { select: { id: true, firstName: true, lastName: true } },
          dateOfJoining: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNext: filters.page * filters.limit < total,
        hasPrev: filters.page > 1,
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        employeeId: true,
        designation: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        managerId: true,
        manager: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        dateOfJoining: true,
        dateOfBirth: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        subordinates: {
          select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true },
        },
        assignedLocations: {
          include: { location: { select: { id: true, name: true, address: true } } },
        },
        leaveRequests: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, type: true, status: true, startDate: true, endDate: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    return user;
  }

  async update(id: string, data: Record<string, any>) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const updateData: any = {};
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'designation', 'departmentId',
      'managerId', 'dateOfJoining', 'dateOfBirth', 'address',
      'emergencyContact', 'emergencyPhone', 'role',
    ];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'dateOfJoining' || field === 'dateOfBirth') {
          updateData[field] = new Date(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        employeeId: true,
        designation: true,
        departmentId: true,
        isActive: true,
      },
    });

    return updated;
  }

  async deactivate(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return updated;
  }

  async getBirthdays() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        employeeId: true,
        department: { select: { name: true } },
        avatar: true,
      },
    });

    const birthdays = users
      .filter((u) => {
        if (!u.dateOfBirth) return false;
        const bMonth = u.dateOfBirth.getMonth() + 1;
        const bDay = u.dateOfBirth.getDate();
        return bMonth === currentMonth && bDay >= currentDay;
      })
      .sort((a, b) => {
        const aDay = a.dateOfBirth!.getDate();
        const bDay = b.dateOfBirth!.getDate();
        return aDay - bDay;
      })
      .slice(0, 10);

    return birthdays;
  }

  async getAnniversaries() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        dateOfJoining: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfJoining: true,
        employeeId: true,
        department: { select: { name: true } },
        avatar: true,
      },
    });

    const anniversaries = users
      .filter((u) => {
        if (!u.dateOfJoining) return false;
        const jMonth = u.dateOfJoining.getMonth() + 1;
        const jDay = u.dateOfJoining.getDate();
        const years = now.getFullYear() - u.dateOfJoining.getFullYear();
        return jMonth === currentMonth && jDay >= currentDay && years > 0;
      })
      .sort((a, b) => {
        const aDay = a.dateOfJoining!.getDate();
        const bDay = b.dateOfJoining!.getDate();
        return aDay - bDay;
      })
      .slice(0, 10)
      .map((u) => ({
        ...u,
        years: now.getFullYear() - u.dateOfJoining!.getFullYear(),
      }));

    return anniversaries;
  }
}

export const employeeService = new EmployeeService();
