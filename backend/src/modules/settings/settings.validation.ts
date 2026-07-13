import { z } from 'zod';

export const updatePolicySchema = z.object({
  shiftStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format').optional(),
  gracePeriodMinutes: z.number().int().min(0).max(120).optional(),
  allowedLatesPerWeek: z.number().int().min(0).optional(),
  allowedLatesPerMonth: z.number().int().min(0).optional(),
  penaltyType: z.enum(['flat', 'percentage']).optional(),
  penaltyAmount: z.number().min(0).optional(),
  penaltyPercentage: z.number().min(0).max(1).optional(),
  isGeofencingEnabled: z.boolean().optional(),
  isWifiVerificationEnabled: z.boolean().optional(),
  isPhotoRequired: z.boolean().optional(),
  enableEscalatingPenalties: z.boolean().optional(),
  escalatingTier2After: z.number().int().min(0).optional(),
  escalatingTier2Amount: z.number().min(0).optional(),
  escalatingTier3After: z.number().int().min(0).optional(),
  escalatingTier3Amount: z.number().min(0).optional(),
  halfDayExemptFromLatePenalty: z.boolean().optional(),
});

export const updateCompanySettingsSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  currency: z.string().min(1).max(10).optional(),
  payrollMode: z.enum(['STRICT', 'SIMPLE']).optional(),
  payPeriod: z.enum(['MONTHLY', 'SEMI_MONTHLY', 'BI_WEEKLY']).optional(),
  weekStartDay: z.number().int().min(0).max(6).optional(),
  standardWorkHours: z.number().min(1).max(24).optional(),
  standardWorkDays: z.number().int().min(1).max(31).optional(),
});
