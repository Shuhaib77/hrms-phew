import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export class LeaveService {
  async applyLeave(userId: string, data: {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      throw new AppError('End date must be after start date', 400, 'INVALID_DATES');
    }

    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    if (overlapping) {
      throw new AppError('You have overlapping leave requests', 409, 'OVERLAPPING_LEAVE');
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const year = start.getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: { userId, year, type: data.type as any },
    });
    const balance = balances[0];

    if (!balance) {
      const newBalance = await prisma.leaveBalance.create({
        data: {
          userId,
          type: data.type as any,
          total: 0,
          used: 0,
          year,
        },
      });
      if (newBalance.total <= 0) {
        throw new AppError(`No leave balance available for ${data.type}`, 400, 'NO_BALANCE');
      }
    }

    if (balance && (balance.total - balance.used) < days) {
      throw new AppError(
        `Insufficient ${data.type} leave balance. Available: ${balance.total - balance.used}`,
        400,
        'INSUFFICIENT_BALANCE'
      );
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        type: data.type as any,
        startDate: start,
        endDate: end,
        reason: data.reason,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'HR_MANAGER'] }, isActive: true },
      select: { id: true },
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'LEAVE_REQUESTED',
          title: 'Leave Request',
          message: `${leaveRequest.user.firstName} ${leaveRequest.user.lastName} requested ${data.type} leave`,
          link: `/leave/${leaveRequest.id}`,
        },
      });
    }

    return leaveRequest;
  }

  async getMyLeaves(userId: string, filters: {
    status?: string;
    type?: string;
    page: number;
    limit: number;
  }) {
    const where: any = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          approver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.leaveRequest.count({ where }),
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

  async getAllLeaves(filters: {
    userId?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.dateFrom || filters.dateTo) {
      where.startDate = {};
      if (filters.dateFrom) where.startDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.startDate.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } },
          approver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.leaveRequest.count({ where }),
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

  async approveLeave(leaveId: string, approverId: string, status: string, comment?: string) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });
    if (!leave) {
      throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
    }
    if (leave.status !== 'PENDING') {
      throw new AppError('Leave request is already processed', 400, 'ALREADY_PROCESSED');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: status as any,
        approverId,
        comment,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (status === 'APPROVED') {
      const days = Math.ceil(
        (leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      const year = leave.startDate.getFullYear();

      const balance = await prisma.leaveBalance.findFirst({
        where: { userId: leave.userId, type: leave.type, year },
      });
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { used: { increment: days } },
        });
      }

      await prisma.notification.create({
        data: {
          userId: leave.userId,
          type: 'LEAVE_APPROVED',
          title: 'Leave Approved',
          message: `Your ${leave.type} leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been approved`,
          link: `/leave/${leave.id}`,
        },
      });
    } else if (status === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: leave.userId,
          type: 'LEAVE_REJECTED',
          title: 'Leave Rejected',
          message: `Your ${leave.type} leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been rejected`,
          link: `/leave/${leave.id}`,
        },
      });
    }

    return updated;
  }

  async getBalance(userId: string) {
    const year = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: { userId, year },
    });

    if (balances.length === 0) {
      const types = ['SICK', 'CASUAL', 'PAID', 'UNPAID', 'OPTIONAL'];
      const defaults: Record<string, number> = {
        SICK: 12,
        CASUAL: 12,
        PAID: 18,
        UNPAID: 0,
        OPTIONAL: 3,
      };

      for (const type of types) {
        await prisma.leaveBalance.create({
          data: {
            userId,
            type: type as any,
            total: defaults[type],
            used: 0,
            year,
          },
        });
      }

      return types.map((t) => ({
        type: t,
        total: defaults[t],
        used: 0,
        available: defaults[t],
        year,
      }));
    }

    return balances.map((b) => ({
      type: b.type,
      total: b.total,
      used: b.used,
      available: b.total - b.used,
      year: b.year,
    }));
  }

  async updateBalance(userId: string, data: {
    type: string;
    total: number;
    year?: number;
  }) {
    const year = data.year || new Date().getFullYear();
    const balance = await prisma.leaveBalance.findFirst({
      where: { userId, type: data.type as any, year },
    });

    if (balance) {
      const updated = await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { total: data.total },
      });
      return updated;
    }

    const created = await prisma.leaveBalance.create({
      data: {
        userId,
        type: data.type as any,
        total: data.total,
        used: 0,
        year,
      },
    });
    return created;
  }

  async getCalendar(filters: {
    month?: number;
    year?: number;
    departmentId?: string;
  }) {
    const year = filters.year || new Date().getFullYear();
    const month = filters.month || new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const whereLeaves: any = {
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };

    if (filters.departmentId) {
      whereLeaves.user = { departmentId: filters.departmentId };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: whereLeaves,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    });

    return { holidays, leaves, month, year };
  }
}

export const leaveService = new LeaveService();
