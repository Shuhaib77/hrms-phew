import { z } from 'zod';

export const generatePayslipSchema = z.object({
  userId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
});

export const bulkGenerateSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
});

export const updatePayslipSchema = z.object({
  basic: z.number().min(0).optional(),
  hra: z.number().min(0).optional(),
  allowances: z.record(z.number()).optional(),
  deductions: z.record(z.number()).optional(),
});

export const salaryStructureSchema = z.object({
  basic: z.number().min(0),
  hra: z.number().min(0),
  allowances: z.record(z.number()).optional(),
  deductions: z.record(z.number()).optional(),
  effectiveFrom: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const payslipFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const overtimeSchema = z.object({
  date: z.string(),
  hours: z.number().min(0.5).max(24),
  reason: z.string().optional(),
});

export const overtimeApproveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const disputeSchema = z.object({
  payslipId: z.string().uuid().optional(),
  attendanceId: z.string().uuid().optional(),
  reason: z.string().min(1),
  description: z.string().optional(),
});

export const disputeResolveSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  resolution: z.string().min(1),
});

export const resolveIncompletePunchSchema = z.object({
  resolution: z.enum(['FULL_DAY', 'HALF_DAY', 'ABSENT']),
  checkoutTime: z.string().optional(),
  note: z.string().optional(),
});

export const adjustmentSchema = z.object({
  payslipId: z.string().uuid(),
  type: z.enum(['BONUS', 'REIMBURSEMENT', 'DEDUCTION', 'CORRECTION']),
  amount: z.number(),
  reason: z.string().min(1),
});