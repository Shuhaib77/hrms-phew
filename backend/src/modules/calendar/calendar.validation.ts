import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string(),
  type: z.string().optional().default('PUBLIC'),
  locationId: z.string().uuid().optional(),
});

export const holidayFilterSchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  locationId: z.string().uuid().optional(),
});
