import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export class CalendarService {
  async getHolidays(filters: { year?: number; month?: number; locationId?: string }) {
    const where: any = {};
    if (filters.year || filters.month) {
      where.date = {};
      if (filters.year) {
        where.date.gte = new Date(filters.year, 0, 1);
        where.date.lte = new Date(filters.year, 11, 31, 23, 59, 59, 999);
      }
      if (filters.month) {
        const year = filters.year || new Date().getFullYear();
        where.date.gte = new Date(year, filters.month - 1, 1);
        where.date.lte = new Date(year, filters.month, 0, 23, 59, 59, 999);
      }
    }
    if (filters.locationId) where.locationId = filters.locationId;

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    return holidays;
  }

  async getEvents(filters: { year?: number; month?: number }) {
    const year = filters.year || new Date().getFullYear();
    const month = filters.month ?? new Date().getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [holidays, leaves] = await Promise.all([
      prisma.holiday.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
      prisma.leaveRequest.findMany({
        where: {
          status: 'APPROVED',
          startDate: { lte: end },
          endDate: { gte: start },
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const events: any[] = [];

    for (const h of holidays) {
      events.push({
        id: h.id,
        date: h.date.toISOString().slice(0, 10),
        title: h.name,
        type: 'holiday',
        holidayType: h.type,
      });
    }

    for (const l of leaves) {
      const startDate = new Date(l.startDate);
      const endDate = new Date(l.endDate);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        events.push({
          id: `${l.id}-${d.toISOString().slice(0, 10)}`,
          date: d.toISOString().slice(0, 10),
          title: `${l.user.firstName} ${l.user.lastName} - ${l.type.replace('_', ' ')}`,
          type: 'leave',
          leaveType: l.type,
          employeeId: l.user.id,
          employeeName: `${l.user.firstName} ${l.user.lastName}`,
          leaveId: l.id,
        });
      }
    }

    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }

  async createHoliday(data: {
    name: string;
    date: string;
    type?: string;
    locationId?: string;
  }) {
    const existing = await prisma.holiday.findFirst({
      where: { date: new Date(data.date) },
    });
    if (existing) {
      throw new AppError('Holiday already exists on this date', 409, 'HOLIDAY_EXISTS');
    }

    const holiday = await prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        type: data.type || 'PUBLIC',
        locationId: data.locationId,
      },
    });
    return holiday;
  }

  async deleteHoliday(id: string) {
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw new AppError('Holiday not found', 404, 'HOLIDAY_NOT_FOUND');
    await prisma.holiday.delete({ where: { id } });
  }
}

export const calendarService = new CalendarService();
