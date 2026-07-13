import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { haversineDistance, calculateLateMinutes, calculatePenalty, stripExif } from '../../shared/utils.js';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/index.js';

export class AttendanceService {
  async punch(
    userId: string,
    data: {
      latitude?: number;
      longitude?: number;
      locationId?: string;
      type?: string;
      wifiBssid?: string;
      selfieFile?: Express.Multer.File;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const lastPunch = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: startOfDay, lt: endOfDay },
        status: 'APPROVED',
      },
      orderBy: { timestamp: 'desc' },
    });

    let type = data.type;
    if (!type) {
      type = !lastPunch || lastPunch.type === 'CHECK_OUT' ? 'CHECK_IN' : 'CHECK_OUT';
    }

    if (lastPunch && lastPunch.type === type) {
      throw new AppError(`Already punched ${type}`, 400, 'DUPLICATE_PUNCH');
    }

    const policy = await prisma.attendancePolicy.findFirst();
    if (!policy) {
      throw new AppError('Attendance policy not configured', 500, 'POLICY_NOT_FOUND');
    }

    let selfiePath: string | undefined;
    if (data.selfieFile) {
      const buffer = fs.readFileSync(data.selfieFile.path);
      const stripped = await stripExif(buffer);
      fs.writeFileSync(data.selfieFile.path, stripped);
      selfiePath = data.selfieFile.path;
    }

    let matchedLocationId = data.locationId;

    const activeLocations = await prisma.location.findMany({
      where: { isActive: true },
    });

    if (policy.isGeofencingEnabled && data.latitude && data.longitude) {
      if (matchedLocationId) {
        const location = activeLocations.find((l) => l.id === matchedLocationId);
        if (!location) throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
        const distance = haversineDistance(data.latitude, data.longitude, location.latitude, location.longitude);
        if (distance > location.radius) {
          throw new AppError(
            `You are ${Math.round(distance)}m from the site (max ${location.radius}m)`,
            400,
            'OUTSIDE_GEOFENCE'
          );
        }
      } else {
        const nearest = activeLocations
          .map((loc) => ({
            loc,
            distance: haversineDistance(data.latitude!, data.longitude!, loc.latitude, loc.longitude),
          }))
          .filter((entry) => entry.distance <= entry.loc.radius)
          .sort((a, b) => a.distance - b.distance)[0];

        if (nearest) {
          matchedLocationId = nearest.loc.id;
        } else if (policy.isGeofencingEnabled && activeLocations.length > 0) {
          throw new AppError(
            'You are outside all company geofence zones',
            400,
            'OUTSIDE_GEOFENCE'
          );
        }
      }
    }

    if (policy.isWifiVerificationEnabled) {
      if (!data.wifiBssid) {
        throw new AppError(
          'Wi-Fi verification is enabled. Please connect to the office Wi-Fi.',
          400,
          'WIFI_BSSID_REQUIRED'
        );
      }

      if (!matchedLocationId && data.latitude && data.longitude) {
        const nearest = activeLocations
          .map((loc) => ({
            loc,
            distance: haversineDistance(data.latitude!, data.longitude!, loc.latitude, loc.longitude),
          }))
          .sort((a, b) => a.distance - b.distance)[0];
        if (nearest) matchedLocationId = nearest.loc.id;
      }

      if (matchedLocationId) {
        const matchedLoc = activeLocations.find((l) => l.id === matchedLocationId);
        if (matchedLoc && matchedLoc.isWifiVerificationEnabled) {
          const bssids = (matchedLoc.wifiBssids as string[]) || [];
          if (bssids.length > 0 && !bssids.includes(data.wifiBssid)) {
            throw new AppError(
              `Connected Wi-Fi (${data.wifiBssid}) not recognised for ${matchedLoc.name}. Connect to the office Wi-Fi and try again.`,
              400,
              'WIFI_BSSID_MISMATCH'
            );
          }
        }
      } else {
        const wifiLoc = activeLocations.find((l) => {
          const bssids = (l.wifiBssids as string[]) || [];
          return bssids.includes(data.wifiBssid!);
        });
        if (wifiLoc) {
          matchedLocationId = wifiLoc.id;
        } else {
          const anyWifiLoc = activeLocations.find((l) => l.isWifiVerificationEnabled);
          if (anyWifiLoc) {
            throw new AppError(
              `Connected Wi-Fi (${data.wifiBssid}) not recognised. Connect to the office Wi-Fi and try again.`,
              400,
              'WIFI_BSSID_MISMATCH'
            );
          }
        }
      }
    }

    if (type === 'CHECK_IN' && policy.isPhotoRequired && !data.selfieFile) {
      throw new AppError('Selfie photo is required for check-in', 400, 'SELFIE_REQUIRED');
    }

    let isLate = false;
    let lateMinutes = 0;
    if (type === 'CHECK_IN') {
      const lateInfo = calculateLateMinutes(policy.shiftStartTime, policy.gracePeriodMinutes, now);
      isLate = lateInfo.isLate;
      lateMinutes = lateInfo.lateMinutes;
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        type,
        timestamp: now,
        date: startOfDay,
        latitude: data.latitude,
        longitude: data.longitude,
        locationId: matchedLocationId,
        selfiePath,
        isLate,
        lateMinutes,
        wifiBssid: data.wifiBssid,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      include: {
        location: { select: { id: true, name: true } },
      },
    });

    return attendance;
  }

  async getMyAttendance(
    userId: string,
    filters: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      page: number;
      limit: number;
    }
  ) {
    const where: any = { userId };
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          location: { select: { id: true, name: true } },
        },
      }),
      prisma.attendance.count({ where }),
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

  async getTodayTimeline(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const records = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lt: endOfDay },
      },
      orderBy: { timestamp: 'asc' },
      include: {
        location: { select: { id: true, name: true } },
      },
    });

    return records;
  }

  async getAllAttendance(filters: {
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    type?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const orderBy: any = {};
    orderBy[filters.sortBy || 'timestamp'] = filters.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true } },
          location: { select: { id: true, name: true } },
          overrideBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.attendance.count({ where }),
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

  async overrideAttendance(
    attendanceId: string,
    adminId: string,
    data: {
      status: string;
      rejectionReason?: string;
      overrideNote?: string;
    }
  ) {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });
    if (!attendance) {
      throw new AppError('Attendance record not found', 404, 'ATTENDANCE_NOT_FOUND');
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: data.status as any,
        rejectionReason: data.rejectionReason,
        overrideNote: data.overrideNote,
        overrideById: adminId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        overrideBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return updated;
  }

  async getStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalToday, monthRecords, currentMonthLates] = await Promise.all([
      prisma.attendance.count({
        where: {
          userId,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      }),
      prisma.attendance.findMany({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.attendance.count({
        where: {
          userId,
          isLate: true,
          date: { gte: startOfMonth, lte: endOfMonth },
          type: 'CHECK_IN',
        },
      }),
    ]);

    const checkIns = monthRecords.filter((r) => r.type === 'CHECK_IN').length;
    const checkOuts = monthRecords.filter((r) => r.type === 'CHECK_OUT').length;
    const lateDays = monthRecords.filter((r) => r.isLate).length;
    const rejected = monthRecords.filter((r) => r.status === 'REJECTED').length;

    let avgHours = 0;
    const pairs: { in: Date; out: Date }[] = [];
    for (let i = 0; i < monthRecords.length; i++) {
      if (monthRecords[i].type === 'CHECK_IN') {
        const checkOut = monthRecords.slice(i).find((r) => r.type === 'CHECK_OUT');
        if (checkOut) {
          pairs.push({ in: monthRecords[i].timestamp, out: checkOut.timestamp });
        }
      }
    }
    if (pairs.length > 0) {
      const totalMs = pairs.reduce((sum, p) => sum + (p.out.getTime() - p.in.getTime()), 0);
      avgHours = totalMs / pairs.length / (1000 * 60 * 60);
    }

    const policy = await prisma.attendancePolicy.findFirst();

    return {
      today: totalToday,
      month: { checkIns, checkOuts, total: monthRecords.length },
      lateDays,
      currentMonthLates,
      rejected,
      averageHours: Math.round(avgHours * 100) / 100,
      penalty: policy ? calculatePenalty(0, currentMonthLates, {
        penaltyType: policy.penaltyType,
        penaltyAmount: policy.penaltyAmount,
        penaltyPercentage: policy.penaltyPercentage,
        basic: 0,
        enableEscalatingPenalties: policy.enableEscalatingPenalties,
        escalatingTier2After: policy.escalatingTier2After,
        escalatingTier2Amount: policy.escalatingTier2Amount,
        escalatingTier3After: policy.escalatingTier3After,
        escalatingTier3Amount: policy.escalatingTier3Amount,
      }) : 0,
    };
  }

  async getLateReport(filters: {
    dateFrom?: string;
    dateTo?: string;
    page: number;
    limit: number;
  }) {
    const where: any = { isLate: true, type: 'CHECK_IN' };
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true, department: { select: { name: true } } } },
        },
      }),
      prisma.attendance.count({ where }),
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
}

export const attendanceService = new AttendanceService();
