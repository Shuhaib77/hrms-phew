import { z } from 'zod';

export const applyLeaveSchema = z.object({
  type: z.enum(['SICK', 'CASUAL', 'PAID', 'UNPAID', 'OPTIONAL']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

export const approveLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});

export const updateBalanceSchema = z.object({
  type: z.enum(['SICK', 'CASUAL', 'PAID', 'UNPAID', 'OPTIONAL']),
  total: z.number().min(0),
  year: z.number().int().optional(),
});

export const leaveFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
