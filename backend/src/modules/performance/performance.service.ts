import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export class PerformanceService {
  async getReviews(userId: string) {
    const reviews = await prisma.performanceReview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return reviews;
  }

  async createReview(data: {
    userId: string;
    reviewerId: string;
    cycle: string;
    quality: number;
    timeliness: number;
    collaboration: number;
    ownership: number;
    feedback?: string;
  }) {
    const overallScore = (data.quality + data.timeliness + data.collaboration + data.ownership) / 4;

    const review = await prisma.performanceReview.create({
      data: {
        userId: data.userId,
        reviewerId: data.reviewerId,
        cycle: data.cycle,
        quality: data.quality,
        timeliness: data.timeliness,
        collaboration: data.collaboration,
        ownership: data.ownership,
        overallScore,
        feedback: data.feedback,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return review;
  }

  async getCurrentEOM() {
    const now = new Date();
    const eom = await prisma.employeeOfTheMonth.findFirst({
      where: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            avatar: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
        selectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return eom;
  }

  async getEOMHistory(limit?: number) {
    const history = await prisma.employeeOfTheMonth.findMany({
      where: { isActive: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: limit || 12,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            avatar: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
        selectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return history;
  }

  async selectEOM(adminId: string, data: {
    userId: string;
    month: number;
    year: number;
    reason?: string;
  }) {
    const existing = await prisma.employeeOfTheMonth.findFirst({
      where: { month: data.month, year: data.year, isActive: true },
    });
    if (existing) {
      await prisma.employeeOfTheMonth.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }

    const eom = await prisma.employeeOfTheMonth.create({
      data: {
        userId: data.userId,
        month: data.month,
        year: data.year,
        reason: data.reason,
        selectedById: adminId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        selectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: 'EOM_SELECTED',
        title: 'Employee of the Month',
        message: `Congratulations! You have been selected as Employee of the Month for ${this.getMonthName(data.month)} ${data.year}`,
        link: '/performance/eom',
      },
    });

    return eom;
  }

  async getSuggestions() {
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: 'ADMIN' },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        designation: true,
        department: { select: { name: true } },
        performanceReviews: {
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: { overallScore: true, cycle: true },
        },
      },
    });

    const suggestions = employees
      .map((emp) => {
        const avgScore = emp.performanceReviews.length > 0
          ? emp.performanceReviews.reduce((s, r) => s + r.overallScore, 0) / emp.performanceReviews.length
          : 0;
        return {
          ...emp,
          averageScore: Math.round(avgScore * 100) / 100,
          reviewCount: emp.performanceReviews.length,
        };
      })
      .filter((emp) => emp.reviewCount > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    return suggestions;
  }

  private getMonthName(month: number): string {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[month - 1] || '';
  }
}

export const performanceService = new PerformanceService();
