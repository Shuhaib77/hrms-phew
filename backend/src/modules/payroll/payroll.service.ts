import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/index.js';

export class PayrollService {
  private async getCompanySettings() {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: {} });
    }
    return settings;
  }

  private getWeeklyLateCounts(lateRecords: { date: Date; lateMinutes: number }[], weekStartDay: number): { weekKey: string; count: number; totalLateMinutes: number }[] {
    const weeks: Record<string, { count: number; totalLateMinutes: number }> = {};
    for (const rec of lateRecords) {
      const d = new Date(rec.date);
      const day = d.getDay();
      const diff = (day < weekStartDay ? day - weekStartDay - 7 : day - weekStartDay);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - diff);
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = { count: 0, totalLateMinutes: 0 };
      weeks[key].count += 1;
      weeks[key].totalLateMinutes += rec.lateMinutes;
    }
    return Object.entries(weeks).map(([weekKey, val]) => ({ weekKey, ...val }));
  }

  async getMyPayslips(userId: string) {
    const payslips = await prisma.payslip.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: {
        id: true, month: true, year: true,
        grossPay: true, totalDeductions: true, netPay: true,
        status: true, isLocked: true, payrollMode: true,
        shortHours: true, overtimeHours: true, overtimePay: true,
        createdAt: true,
      },
    });
    return payslips;
  }

  async getPayslips(filters: {
    userId?: string; month?: number; year?: number; status?: string;
    page: number; limit: number;
  }) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } },
        },
      }),
      prisma.payslip.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: filters.page, limit: filters.limit, total: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
        hasNext: filters.page * filters.limit < total,
        hasPrev: filters.page > 1,
      },
    };
  }

  async generatePayslip(userId: string, month: number, year: number, generatedById: string) {
    const existing = await prisma.payslip.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });
    if (existing) {
      throw new AppError('Payslip already exists for this period', 409, 'PAYSLIP_EXISTS');
    }

    const structure = await prisma.salaryStructure.findFirst({
      where: {
        userId,
        effectiveFrom: { lte: new Date(year, month - 1, 1) },
        AND: [
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date(year, month - 1, 1) } }] },
        ],
      },
    });

    if (!structure) {
      throw new AppError('No salary structure found for this employee', 404, 'NO_SALARY_STRUCTURE');
    }

    const settings = await this.getCompanySettings();
    const payrollMode = settings.payrollMode;

    const day1 = new Date(year, month - 1, 1);
    const day31 = new Date(year, month, 0, 23, 59, 59);

    const incompletePunches = await prisma.attendance.count({
      where: {
        userId,
        date: { gte: day1, lte: day31 },
        isIncompletePunch: true,
        resolvedAt: null,
      },
    });
    if (incompletePunches > 0) {
      throw new AppError(
        `Cannot generate payslip: ${incompletePunches} incomplete punch(es) need resolution`,
        400, 'INCOMPLETE_PUNCHES'
      );
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: day1, lte: day31 },
        type: 'CHECK_IN',
      },
      orderBy: { date: 'asc' },
    });

    const attendanceDays = new Map<string, { checkIn: Date | null; checkOut: Date | null; isLate: boolean; lateMinutes: number }>();
    const checkOutRecords = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: day1, lte: day31 },
        type: 'CHECK_OUT',
      },
    });
    for (const a of attendanceRecords) {
      const dateKey = a.date.toISOString().slice(0, 10);
      attendanceDays.set(dateKey, {
        checkIn: a.timestamp,
        checkOut: null,
        isLate: a.isLate,
        lateMinutes: a.lateMinutes,
      });
    }
    for (const c of checkOutRecords) {
      const dateKey = c.date.toISOString().slice(0, 10);
      const existing = attendanceDays.get(dateKey);
      if (existing) {
        existing.checkOut = c.timestamp;
      }
    }

    const lateRecords = attendanceRecords.filter(a => a.isLate).map(a => ({ date: a.date, lateMinutes: a.lateMinutes }));

    const policy = await prisma.attendancePolicy.findFirst();
    const dailyRate = structure.monthlyGross / settings.standardWorkDays;
    const hourlyRate = dailyRate / settings.standardWorkHours;

    let shortHoursTotal = 0;
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;

    const daysInMonth = new Date(year, month, 0).getDate();

    if (payrollMode === 'STRICT') {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const day = attendanceDays.get(dateKey);
        if (day && day.checkIn && day.checkOut) {
          const actualHours = (day.checkOut.getTime() - day.checkIn.getTime()) / (1000 * 60 * 60);
          if (actualHours < settings.standardWorkHours) {
            const shortfall = settings.standardWorkHours - actualHours;
            shortHoursTotal += shortfall;
          }
          if (actualHours >= settings.standardWorkHours * 0.5) {
            presentDays++;
          } else {
            halfDays++;
          }
        } else if (day && day.checkIn) {
          shortHoursTotal += settings.standardWorkHours;
        } else {
          const isWeekend = new Date(year, month - 1, d).getDay() === 0 || new Date(year, month - 1, d).getDay() === 6;
          if (!isWeekend) absentDays++;
        }
      }
    } else {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const day = attendanceDays.get(dateKey);
        if (day && day.checkIn) {
          presentDays++;
        } else {
          const isWeekend = new Date(year, month - 1, d).getDay() === 0 || new Date(year, month - 1, d).getDay() === 6;
          if (!isWeekend) absentDays++;
        }
      }
    }

    const weekStartDay = settings.weekStartDay;
    const weeklyCounts = this.getWeeklyLateCounts(lateRecords, weekStartDay);

    let totalPenaltyAmount = 0;
    const penaltyEntries: any[] = [];

    if (policy) {
      const weeklyAllowance = policy.allowedLatesPerWeek;
      const monthlyAllowance = policy.allowedLatesPerMonth || 999;
      let totalLateCount = 0;

      for (const week of weeklyCounts) {
        const excessInWeek = Math.max(0, week.count - weeklyAllowance);
        totalLateCount += week.count;
      }

      const excessTotal = Math.max(0, totalLateCount - monthlyAllowance);

      for (const late of lateRecords) {
        const penaltyAmount = policy ? this.calcLatePenaltyAmount(policy, totalLateCount, structure.basic) : 0;
        if (penaltyAmount > 0) {
          penaltyEntries.push({
            date: late.date,
            lateMinutes: late.lateMinutes,
            amount: penaltyAmount,
          });
          totalPenaltyAmount += penaltyAmount;
        }
      }
    }

    const overtimeRecords = await prisma.overtimeRecord.findMany({
      where: {
        userId,
        date: { gte: day1, lte: day31 },
        status: 'APPROVED',
        payslipId: null,
      },
    });

    let overtimeHours = 0;
    let overtimePay = 0;
    for (const ot of overtimeRecords) {
      overtimeHours += ot.hours;
      overtimePay += ot.hours * hourlyRate * 1.5;
    }

    const allowances = typeof structure.allowances === 'object' && structure.allowances !== null
      ? structure.allowances as Record<string, number> : {};
    const deductions = typeof structure.deductions === 'object' && structure.deductions !== null
      ? structure.deductions as Record<string, number> : {};

    const shortHoursDeduction = shortHoursTotal * hourlyRate;

    let grossPay: number;
    if (payrollMode === 'STRICT') {
      grossPay = (dailyRate * presentDays) + (dailyRate * 0.5 * halfDays) - shortHoursDeduction;
    } else {
      grossPay = (dailyRate * presentDays) + (dailyRate * 0.5 * halfDays);
    }
    grossPay = Math.max(0, grossPay + overtimePay);

    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0) + totalPenaltyAmount;
    const netPay = grossPay - totalDeductions;

    const payslip = await prisma.payslip.create({
      data: {
        userId, month, year,
        basic: structure.basic,
        hra: structure.hra,
        allowances,
        deductions,
        additionalDeductions: [{ type: 'LATE_PENALTIES', amount: totalPenaltyAmount, entries: penaltyEntries }],
        grossPay: Math.round(grossPay * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netPay: Math.round(netPay * 100) / 100,
        generatedById,
        payrollMode,
        shortHours: Math.round(shortHoursTotal * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        latePenalties: penaltyEntries,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true } },
      },
    });

    if (overtimeRecords.length > 0) {
      await prisma.overtimeRecord.updateMany({
        where: { id: { in: overtimeRecords.map(o => o.id) } },
        data: { payslipId: payslip.id },
      });
    }

    const pdfPath = await this.generatePayslipPDF(payslip.id);
    await prisma.payslip.update({
      where: { id: payslip.id },
      data: { pdfPath },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'PAYSLIP_READY',
        title: 'Payslip Ready',
        message: `Your payslip for ${month}/${year} is now available (${payrollMode} mode)`,
        link: `/payroll/payslips/${payslip.id}`,
      },
    });

    return prisma.payslip.findUnique({
      where: { id: payslip.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true } },
        generatedBy: { select: { id: true, firstName: true, lastName: true } },
        adjustments: true,
        overtimeRecords: { where: { status: 'APPROVED' } },
      },
    });
  }

  private calcLatePenaltyAmount(policy: any, totalLateCount: number, basic: number): number {
    if (policy.penaltyType === 'flat') {
      let amount = policy.penaltyAmount;
      if (policy.enableEscalatingPenalties) {
        if (totalLateCount >= policy.escalatingTier3After) {
          amount = policy.escalatingTier3Amount;
        } else if (totalLateCount >= policy.escalatingTier2After) {
          amount = policy.escalatingTier2Amount;
        }
      }
      return amount;
    }
    return basic * policy.penaltyPercentage;
  }

  async generatePayslipPDF(payslipId: string): Promise<string> {
    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, employeeId: true,
            designation: true, department: { select: { name: true } },
          },
        },
        adjustments: true,
        overtimeRecords: { where: { status: 'APPROVED' } },
      },
    });
    if (!payslip) throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');

    const settings = await this.getCompanySettings();
    const currency = settings.currency;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fileName = `payslip_${payslip.user.employeeId}_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`;
    const pdfDir = path.join(config.uploadDir, 'payslips');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const filePath = path.join(pdfDir, fileName);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

    doc.fontSize(20).text(config.companyName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#666').text('Pay Slip', { align: 'center' });
    doc.fillColor('#000');
    doc.moveDown(0.3);
    doc.fontSize(11).text(`Period: ${monthNames[payslip.month - 1]} ${payslip.year}  |  Mode: ${payslip.payrollMode}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Employee: ${payslip.user.firstName} ${payslip.user.lastName}`);
    doc.text(`Employee ID: ${payslip.user.employeeId}`);
    doc.text(`Designation: ${payslip.user.designation || 'N/A'}`);
    doc.text(`Department: ${payslip.user.department?.name || 'N/A'}`);
    doc.moveDown();

    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(545, lineY).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).text('Earnings', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(`Basic: ${fmt(payslip.basic)}`);
    doc.text(`HRA: ${fmt(payslip.hra)}`);
    const allowances = payslip.allowances as Record<string, number>;
    for (const [key, val] of Object.entries(allowances)) {
      doc.text(`${key}: ${fmt(Number(val))}`);
    }

    if (payslip.shortHours > 0) {
      doc.text(`Short Hours (${payslip.shortHours}h): -${fmt(payslip.shortHours * (payslip.basic / 22 / 8))}`, { continued: false });
    }

    if (payslip.overtimeHours > 0) {
      doc.text(`Overtime (${payslip.overtimeHours}h approved): ${fmt(payslip.overtimePay)}`);
    }

    const adjustments = payslip.adjustments as any[];
    if (adjustments && adjustments.length > 0) {
      for (const adj of adjustments) {
        const sign = adj.type === 'DEDUCTION' ? '-' : '+';
        doc.text(`${adj.type}: ${sign}${fmt(Math.abs(adj.amount))} ${adj.reason ? '(' + adj.reason + ')' : ''}`);
      }
    }

    doc.moveDown();
    doc.fontSize(12).text('Deductions', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    const deductions = payslip.deductions as Record<string, number>;
    for (const [key, val] of Object.entries(deductions)) {
      doc.text(`${key}: ${fmt(Number(val))}`);
    }

    const penalties = payslip.latePenalties as any[];
    if (penalties && penalties.length > 0) {
      const totalLatePenalty = penalties.reduce((sum: number, p: any) => sum + p.amount, 0);
      doc.text(`Late Penalties (${penalties.length} occ.): ${fmt(totalLatePenalty)}`);
    }

    doc.moveDown();
    const l2 = doc.y;
    doc.moveTo(50, l2).lineTo(545, l2).stroke();
    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Gross Pay: ${fmt(payslip.grossPay)}`);
    doc.text(`Total Deductions: ${fmt(payslip.totalDeductions)}`);
    doc.fontSize(14).text(`Net Pay: ${fmt(payslip.netPay)}`, { underline: true });
    doc.moveDown(1.5);

    doc.fontSize(8).fillColor('#999');
    doc.text(`Payslip ID: ${payslip.id.slice(0, 8).toUpperCase()} | Generated: ${new Date().toISOString().slice(0, 10)} | Mode: ${payslip.payrollMode}`);
    doc.text('This is a computer-generated payslip.', { align: 'center' });
    doc.fillColor('#000');

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  async downloadPayslipPDF(payslipId: string): Promise<{ path: string; filename: string }> {
    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: { user: { select: { employeeId: true } } },
    });
    if (!payslip) throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');

    if (payslip.pdfPath && fs.existsSync(payslip.pdfPath)) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        path: payslip.pdfPath,
        filename: `payslip_${payslip.user.employeeId}_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`,
      };
    }

    const pdfPath = await this.generatePayslipPDF(payslipId);
    await prisma.payslip.update({ where: { id: payslipId }, data: { pdfPath } });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      path: pdfPath,
      filename: `payslip_${payslip.user.employeeId}_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`,
    };
  }

  async bulkGenerate(month: number, year: number, generatedById: string) {
    const employees = await prisma.user.findMany({
      where: { isActive: true, role: { not: 'ADMIN' } },
      select: { id: true },
    });

    const results: any[] = [];
    for (const emp of employees) {
      try {
        const payslip = await this.generatePayslip(emp.id, month, year, generatedById);
        results.push({ userId: emp.id, success: true, payslipId: payslip?.id });
      } catch (err: any) {
        results.push({ userId: emp.id, success: false, error: err.message });
      }
    }
    return results;
  }

  async updateDraftPayslip(payslipId: string, data: {
    basic?: number; hra?: number;
    allowances?: Record<string, number>; deductions?: Record<string, number>;
  }) {
    const payslip = await prisma.payslip.findUnique({ where: { id: payslipId } });
    if (!payslip) throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');
    if (payslip.isLocked) throw new AppError('Payslip is locked', 400, 'PAYSLIP_LOCKED');
    if (payslip.status !== 'DRAFT') throw new AppError('Can only update draft payslips', 400, 'NOT_DRAFT');

    const updateData: any = {};
    if (data.basic !== undefined) updateData.basic = data.basic;
    if (data.hra !== undefined) updateData.hra = data.hra;
    if (data.allowances) updateData.allowances = data.allowances;
    if (data.deductions) updateData.deductions = data.deductions;

    const basic = data.basic ?? payslip.basic;
    const hra = data.hra ?? payslip.hra;
    const allowances = data.allowances ?? (payslip.allowances as Record<string, number>);
    const deductions = data.deductions ?? (payslip.deductions as Record<string, number>);
    const extraDeductions = (payslip.additionalDeductions as any[]).reduce((a: number, b: any) => a + (b.amount || 0), 0);

    const grossPay = basic + hra + Object.values(allowances).reduce((a, b) => a + b, 0) + payslip.overtimePay;
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0) + extraDeductions;
    updateData.grossPay = Math.round(grossPay * 100) / 100;
    updateData.totalDeductions = Math.round(totalDeductions * 100) / 100;
    updateData.netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

    const updated = await prisma.payslip.update({
      where: { id: payslipId },
      data: updateData,
    });
    return updated;
  }

  async finalizePayslip(payslipId: string) {
    const payslip = await prisma.payslip.findUnique({ where: { id: payslipId } });
    if (!payslip) throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');
    if (payslip.isLocked) throw new AppError('Payslip is already locked', 400, 'ALREADY_LOCKED');

    const updated = await prisma.payslip.update({
      where: { id: payslipId },
      data: { status: 'FINALIZED', isLocked: true },
    });
    return updated;
  }

  async getSalaryStructure(userId: string) {
    const structure = await prisma.salaryStructure.findFirst({
      where: { userId, effectiveTo: null },
      orderBy: { effectiveFrom: 'desc' },
    });
    return structure;
  }

  async updateSalaryStructure(userId: string, data: {
    basic: number; hra: number;
    allowances?: Record<string, number>; deductions?: Record<string, number>;
    effectiveFrom?: string;
  }) {
    const current = await prisma.salaryStructure.findFirst({
      where: { userId, effectiveTo: null },
    });

    if (current) {
      await prisma.salaryStructure.update({
        where: { id: current.id },
        data: { effectiveTo: new Date() },
      });
    }

    const allowances = data.allowances || {};
    const deductions = data.deductions || {};
    const monthlyGross = data.basic + data.hra + Object.values(allowances).reduce((a, b) => a + b, 0);
    const monthlyNet = monthlyGross - Object.values(deductions).reduce((a, b) => a + b, 0);

    const structure = await prisma.salaryStructure.create({
      data: {
        userId,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        basic: data.basic,
        hra: data.hra,
        allowances,
        deductions,
        monthlyGross,
        monthlyNet,
      },
    });
    return structure;
  }

  async getOvertimeRequests(query: any) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    return prisma.overtimeRecord.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyOvertime(userId: string) {
    return prisma.overtimeRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async requestOvertime(userId: string, data: { date: string; hours: number; reason?: string }) {
    return prisma.overtimeRecord.create({
      data: {
        userId,
        date: new Date(data.date),
        hours: data.hours,
        reason: data.reason,
      },
    });
  }

  async approveOvertime(overtimeId: string, status: string, approvedById: string) {
    const record = await prisma.overtimeRecord.findUnique({ where: { id: overtimeId } });
    if (!record) throw new AppError('Overtime record not found', 404, 'OT_NOT_FOUND');

    const updated = await prisma.overtimeRecord.update({
      where: { id: overtimeId },
      data: {
        status: status as any,
        approvedById,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
      },
    });

    await prisma.notification.create({
      data: {
        userId: record.userId,
        type: status === 'APPROVED' ? 'OVERTIME_APPROVED' : 'OVERTIME_REJECTED',
        title: `Overtime ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your overtime request for ${record.date.toISOString().slice(0, 10)} (${record.hours}h) was ${status.toLowerCase()}`,
      },
    });
    return updated;
  }

  async getDisputes(query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;
    return prisma.dispute.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true } },
        payslip: { select: { id: true, month: true, year: true } },
        attendance: { select: { id: true, date: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyDisputes(userId: string) {
    return prisma.dispute.findMany({
      where: { userId },
      include: {
        payslip: { select: { id: true, month: true, year: true } },
        attendance: { select: { id: true, date: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async raiseDispute(userId: string, data: { payslipId?: string; attendanceId?: string; reason: string; description?: string }) {
    if (!data.payslipId && !data.attendanceId) {
      throw new AppError('Must provide either payslipId or attendanceId', 400, 'INVALID_DISPUTE_TARGET');
    }
    return prisma.dispute.create({
      data: {
        userId,
        payslipId: data.payslipId,
        attendanceId: data.attendanceId,
        reason: data.reason,
        description: data.description,
      },
    });
  }

  async resolveDispute(disputeId: string, data: { status: string; resolution: string }, resolvedById: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { payslip: true },
    });
    if (!dispute) throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: data.status as any,
        resolution: data.resolution,
        resolvedById,
        resolvedAt: new Date(),
      },
    });

    if (data.status === 'RESOLVED' && dispute.payslip?.isLocked) {
      await prisma.oneOffAdjustment.create({
        data: {
          payslipId: dispute.payslipId!,
          type: 'CORRECTION',
          amount: 0,
          reason: `Dispute resolution: ${data.resolution}`,
          createdById: resolvedById,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: dispute.userId,
        type: 'DISPUTE_RESOLVED',
        title: 'Dispute Resolved',
        message: `Your dispute has been ${data.status.toLowerCase()}: ${data.resolution}`,
      },
    });
    return updated;
  }

  async getIncompletePunches(query: any) {
    const where: any = { isIncompletePunch: true, resolvedAt: null };
    if (query.userId) where.userId = query.userId;
    return prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async resolveIncompletePunch(attendanceId: string, data: { resolution: string; checkoutTime?: string; note?: string }, resolvedById: string) {
    const record = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!record) throw new AppError('Attendance record not found', 404, 'ATTENDANCE_NOT_FOUND');

    const updateData: any = {
      isIncompletePunch: false,
      resolvedAt: new Date(),
      resolvedById,
      resolutionNote: data.note || data.resolution,
    };

    if (data.resolution === 'FULL_DAY' && data.checkoutTime) {
      updateData.type = 'CHECK_OUT';
      updateData.timestamp = new Date(data.checkoutTime);
    }

    if (data.resolution === 'ABSENT') {
      updateData.status = 'REJECTED';
    }

    return prisma.attendance.update({
      where: { id: attendanceId },
      data: updateData,
    });
  }

  async getAdjustments(query: any) {
    const where: any = {};
    if (query.payslipId) where.payslipId = query.payslipId;
    return prisma.oneOffAdjustment.findMany({
      where,
      include: {
        payslip: { select: { id: true, month: true, year: true, userId: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdjustment(data: { payslipId: string; type: string; amount: number; reason: string }, createdById: string) {
    const payslip = await prisma.payslip.findUnique({ where: { id: data.payslipId } });
    if (!payslip) throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');

    const adj = await prisma.oneOffAdjustment.create({
      data: {
        payslipId: data.payslipId,
        type: data.type as any,
        amount: data.amount,
        reason: data.reason,
        createdById,
      },
    });

    const allAdjustments = await prisma.oneOffAdjustment.findMany({
      where: { payslipId: data.payslipId },
    });
    const adjTotal = allAdjustments.reduce((sum, a) => {
      if (a.type === 'DEDUCTION') return sum - a.amount;
      return sum + a.amount;
    }, 0);

    const newGross = payslip.grossPay + (adjTotal > 0 ? adjTotal : 0);
    const newNet = newGross - payslip.totalDeductions;

    await prisma.payslip.update({
      where: { id: data.payslipId },
      data: {
        grossPay: Math.round(newGross * 100) / 100,
        netPay: Math.round(newNet * 100) / 100,
      },
    });

    return adj;
  }
}

export const payrollService = new PayrollService();