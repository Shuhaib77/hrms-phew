import { prisma } from '../../config/database.js';

export class ReportsService {
  async getAttendanceSummary(filters: { month?: number; year?: number; departmentId?: string }) {
    const year = filters.year || new Date().getFullYear();
    const month = filters.month || new Date().getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const whereAttendance: any = {
      date: { gte: startDate, lte: endDate },
    };
    if (filters.departmentId) {
      whereAttendance.user = { departmentId: filters.departmentId };
    }

    const records = await prisma.attendance.findMany({
      where: whereAttendance,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, departmentId: true, department: { select: { name: true } } } },
      },
    });

    const totalCheckIns = records.filter((r) => r.type === 'CHECK_IN').length;
    const totalCheckOuts = records.filter((r) => r.type === 'CHECK_OUT').length;
    const lateCount = records.filter((r) => r.isLate).length;
    const uniqueEmployees = new Set(records.map((r) => r.userId)).size;

    const byDepartment: Record<string, { checkIns: number; lates: number; employees: Set<string> }> = {};
    for (const r of records) {
      const dept = r.user.department?.name || 'Unknown';
      if (!byDepartment[dept]) byDepartment[dept] = { checkIns: 0, lates: 0, employees: new Set() };
      if (r.type === 'CHECK_IN') byDepartment[dept].checkIns++;
      if (r.isLate) byDepartment[dept].lates++;
      byDepartment[dept].employees.add(r.userId);
    }

    return {
      period: { month, year },
      summary: { totalCheckIns, totalCheckOuts, lateCount, uniqueEmployees },
      byDepartment: Object.entries(byDepartment).map(([name, data]) => ({
        department: name,
        checkIns: data.checkIns,
        lates: data.lates,
        employees: data.employees.size,
      })),
    };
  }

  async getPayrollSummary(filters: { month?: number; year?: number; departmentId?: string }) {
    const year = filters.year || new Date().getFullYear();
    const month = filters.month || new Date().getMonth() + 1;

    const where: any = { month, year };
    if (filters.departmentId) {
      where.user = { departmentId: filters.departmentId };
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, departmentId: true, department: { select: { name: true } } } },
      },
    });

    const totalGross = payslips.reduce((s, p) => s + p.grossPay, 0);
    const totalDeductions = payslips.reduce((s, p) => s + p.totalDeductions, 0);
    const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);

    return {
      period: { month, year },
      summary: { employees: payslips.length, totalGross, totalDeductions, totalNet },
      byDepartment: [],
    };
  }

  async getLeaveSummary(filters: { month?: number; year?: number; departmentId?: string }) {
    const year = filters.year || new Date().getFullYear();
    const month = filters.month || new Date().getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const where: any = {
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };
    if (filters.departmentId) {
      where.user = { departmentId: filters.departmentId };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, departmentId: true, department: { select: { name: true } } } },
      },
    });

    const totalRequests = leaves.length;
    const approved = leaves.filter((l) => l.status === 'APPROVED').length;
    const rejected = leaves.filter((l) => l.status === 'REJECTED').length;
    const pending = leaves.filter((l) => l.status === 'PENDING').length;

    return {
      period: { month, year },
      summary: { totalRequests, approved, rejected, pending },
      byType: [],
    };
  }
}

export const reportsService = new ReportsService();
