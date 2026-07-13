import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updatePolicySchema, updateCompanySettingsSchema } from './settings.validation.js';

const router = Router();

router.get('/attendance-policy', authenticate, settingsController.getAttendancePolicy.bind(settingsController));
router.put('/attendance-policy', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: updatePolicySchema }), settingsController.updateAttendancePolicy.bind(settingsController));
router.get('/company', authenticate, settingsController.getCompanySettings.bind(settingsController));
router.put('/company', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: updateCompanySettingsSchema }), settingsController.updateCompanySettings.bind(settingsController));

export default router;
