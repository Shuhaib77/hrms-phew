import { Router } from 'express';
import { employeeController } from './employee.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { employeeFilterSchema, updateEmployeeSchema } from './employee.validation.js';

const router = Router();

router.get('/', authenticate, validate({ query: employeeFilterSchema }), employeeController.list.bind(employeeController));
router.get('/birthdays', authenticate, employeeController.getBirthdays.bind(employeeController));
router.get('/anniversaries', authenticate, employeeController.getAnniversaries.bind(employeeController));
router.get('/:id', authenticate, employeeController.getById.bind(employeeController));
router.put('/:id', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: updateEmployeeSchema }), employeeController.update.bind(employeeController));
router.delete('/:id', authenticate, requireRole('ADMIN', 'HR_MANAGER'), employeeController.deactivate.bind(employeeController));

export default router;
