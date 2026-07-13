import { Router } from 'express';
import { leaveController } from './leave.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { applyLeaveSchema, approveLeaveSchema, updateBalanceSchema } from './leave.validation.js';

const router = Router();

router.post('/request', authenticate, validate({ body: applyLeaveSchema }), leaveController.applyLeave.bind(leaveController));
router.get('/my', authenticate, leaveController.getMyLeaves.bind(leaveController));
router.get('/all', authenticate, requireRole('ADMIN', 'HR_MANAGER', 'MANAGER'), leaveController.getAllLeaves.bind(leaveController));
router.put('/:id/approve', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: approveLeaveSchema }), leaveController.approveLeave.bind(leaveController));
router.get('/balance', authenticate, leaveController.getBalance.bind(leaveController));
router.put('/balance', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: updateBalanceSchema }), leaveController.updateBalance.bind(leaveController));
router.get('/calendar', authenticate, leaveController.getCalendar.bind(leaveController));

export default router;
