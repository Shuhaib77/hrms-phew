import { z } from 'zod';

const bssidPattern = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export const punchSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  locationId: z.string().uuid().optional(),
  type: z.enum(['CHECK_IN', 'CHECK_OUT']).optional(),
  wifiBssid: z.string().regex(bssidPattern, 'Invalid BSSID format (use XX:XX:XX:XX:XX:XX)').optional(),
});

export const overrideSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'MANUALLY_OVERRIDDEN']),
  rejectionReason: z.string().optional(),
  overrideNote: z.string().optional(),
});

export const attendanceFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
