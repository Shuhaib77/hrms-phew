import { z } from 'zod';

export const reportFilterSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
  departmentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});
