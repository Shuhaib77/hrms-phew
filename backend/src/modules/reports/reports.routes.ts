import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/attendance-summary', authenticate, requireRole('ADMIN', 'HR_MANAGER'), reportsController.getAttendanceSummary.bind(reportsController));
router.get('/payroll-summary', authenticate, requireRole('ADMIN', 'HR_MANAGER'), reportsController.getPayrollSummary.bind(reportsController));
router.get('/leave-summary', authenticate, requireRole('ADMIN', 'HR_MANAGER'), reportsController.getLeaveSummary.bind(reportsController));

export default router;
