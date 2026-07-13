import { z } from 'zod';

export const createReviewSchema = z.object({
  userId: z.string().uuid(),
  cycle: z.string(),
  quality: z.number().int().min(0).max(10),
  timeliness: z.number().int().min(0).max(10),
  collaboration: z.number().int().min(0).max(10),
  ownership: z.number().int().min(0).max(10),
  feedback: z.string().optional(),
});

export const selectEOMSchema = z.object({
  userId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  reason: z.string().optional(),
});
