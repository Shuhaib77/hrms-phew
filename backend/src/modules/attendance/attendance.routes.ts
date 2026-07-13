import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { punchSchema, overrideSchema, attendanceFilterSchema } from './attendance.validation.js';
import { uploadSingle } from '../../middleware/upload.js';
import rateLimit from 'express-rate-limit';
import { config } from '../../config/index.js';

const router = Router();

const attendanceLimiter = rateLimit({
  windowMs: config.rateLimit.attendance.window,
  max: config.rateLimit.attendance.max,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many attendance requests' } },
});

router.post('/punch', authenticate, attendanceLimiter, uploadSingle('selfie'), validate({ body: punchSchema }), attendanceController.punch.bind(attendanceController));
router.get('/my', authenticate, attendanceController.getMyAttendance.bind(attendanceController));
router.get('/today', authenticate, attendanceController.getTodayTimeline.bind(attendanceController));
router.get('/all', authenticate, requireRole('ADMIN', 'HR_MANAGER'), attendanceController.getAllAttendance.bind(attendanceController));
router.post('/:id/override', authenticate, requireRole('ADMIN'), validate({ body: overrideSchema }), attendanceController.overrideAttendance.bind(attendanceController));
router.get('/stats', authenticate, attendanceController.getStats.bind(attendanceController));
router.get('/late-report', authenticate, requireRole('ADMIN', 'HR_MANAGER'), attendanceController.getLateReport.bind(attendanceController));

export default router;
