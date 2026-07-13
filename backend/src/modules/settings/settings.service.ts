import { prisma } from '../../config/database.js';

export class SettingsService {
  async getAttendancePolicy() {
    const policy = await prisma.attendancePolicy.findFirst();
    return policy;
  }

  async updateAttendancePolicy(data: Record<string, any>, userId: string) {
    let policy = await prisma.attendancePolicy.findFirst();
    if (!policy) {
      policy = await prisma.attendancePolicy.create({ data: { updatedById: userId } });
    }

    const allowedFields = [
      'shiftStartTime', 'gracePeriodMinutes', 'allowedLatesPerWeek', 'allowedLatesPerMonth',
      'penaltyType', 'penaltyAmount', 'penaltyPercentage', 'isGeofencingEnabled',
      'isWifiVerificationEnabled', 'isPhotoRequired', 'enableEscalatingPenalties', 'escalatingTier2After',
      'escalatingTier2Amount', 'escalatingTier3After', 'escalatingTier3Amount',
      'halfDayExemptFromLatePenalty',
    ];

    const updateData: any = { updatedById: userId };
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updated = await prisma.attendancePolicy.update({
      where: { id: policy.id },
      data: updateData,
    });
    return updated;
  }

  async getCompanySettings() {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: {} });
    }
    return settings;
  }

  async updateCompanySettings(data: Record<string, any>, userId: string) {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: { ...data, updatedById: userId } });
      return settings;
    }

    const allowedFields = [
      'companyName', 'currency', 'payrollMode', 'payPeriod',
      'weekStartDay', 'standardWorkHours', 'standardWorkDays',
    ];

    const updateData: any = { updatedById: userId };
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updated = await prisma.companySettings.update({
      where: { id: settings.id },
      data: updateData,
    });
    return updated;
  }
}

export const settingsService = new SettingsService();