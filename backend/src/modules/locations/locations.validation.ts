import { z } from 'zod';

const bssidPattern = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.coerce.number().int().min(1).max(10000).optional().default(100),
  isActive: z.boolean().optional().default(true),
  isWifiVerificationEnabled: z.boolean().optional().default(false),
  wifiBssids: z.array(z.string().regex(bssidPattern, 'Invalid BSSID format (use XX:XX:XX:XX:XX:XX)')).optional().default([]),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
  isWifiVerificationEnabled: z.boolean().optional(),
  wifiBssids: z.array(z.string().regex(bssidPattern, 'Invalid BSSID format (use XX:XX:XX:XX:XX:XX)')).optional(),
});

export const locationFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});
