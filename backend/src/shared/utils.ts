import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function generateEmployeeId(): string {
  const prefix = 'PHEW';
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${num}`;
}

export function calculatePagination(page: number, limit: number) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
    totalPages: (total: number) => Math.ceil(total / safeLimit),
  };
}

export async function stripExif(buffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    if (metadata.format === 'jpeg' || metadata.format === 'png' || metadata.format === 'webp') {
      return await image.withExifMerge({}).toBuffer();
    }
    return buffer;
  } catch {
    return buffer;
  }
}

export function calculateLateMinutes(
  shiftStart: string,
  gracePeriodMinutes: number,
  checkInTime: Date
): { isLate: boolean; lateMinutes: number } {
  const [hours, minutes] = shiftStart.split(':').map(Number);
  const shiftDate = new Date(checkInTime);
  shiftDate.setHours(hours, minutes, 0, 0);

  const graceEnd = new Date(shiftDate.getTime() + gracePeriodMinutes * 60 * 1000);
  const checkInMs = checkInTime.getTime();

  if (checkInMs <= graceEnd.getTime()) {
    return { isLate: false, lateMinutes: 0 };
  }

  const diffMs = checkInMs - shiftDate.getTime();
  const lateMinutes = Math.round(diffMs / 60000);
  return { isLate: true, lateMinutes };
}

export function calculatePenalty(
  lateMinutes: number,
  currentMonthLates: number,
  policy: {
    penaltyType: string;
    penaltyAmount: number;
    penaltyPercentage: number;
    basic: number;
    enableEscalatingPenalties: boolean;
    escalatingTier2After: number;
    escalatingTier2Amount: number;
    escalatingTier3After: number;
    escalatingTier3Amount: number;
  }
): number {
  if (policy.penaltyType === 'flat') {
    let amount = policy.penaltyAmount;
    if (policy.enableEscalatingPenalties) {
      if (currentMonthLates >= policy.escalatingTier3After) {
        amount = policy.escalatingTier3Amount;
      } else if (currentMonthLates >= policy.escalatingTier2After) {
        amount = policy.escalatingTier2Amount;
      }
    }
    return amount;
  }
  return policy.basic * policy.penaltyPercentage;
}

export function createUUID(): string {
  return uuidv4();
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
