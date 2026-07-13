import { z } from 'zod';

export const employeeFilterSchema = z.object({
  departmentId: z.string().uuid().optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().nullable().optional(),
  dateOfJoining: z.string().datetime().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']).optional(),
});
