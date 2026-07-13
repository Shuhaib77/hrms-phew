import { Router } from 'express';
import { calendarController } from './calendar.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createHolidaySchema, holidayFilterSchema } from './calendar.validation.js';

const router = Router();

router.get('/holidays', authenticate, validate({ query: holidayFilterSchema }), calendarController.getHolidays.bind(calendarController));
router.get('/events', authenticate, calendarController.getEvents.bind(calendarController));
router.post('/holidays', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: createHolidaySchema }), calendarController.createHoliday.bind(calendarController));
router.delete('/holidays/:id', authenticate, requireRole('ADMIN'), calendarController.deleteHoliday.bind(calendarController));

export default router;
