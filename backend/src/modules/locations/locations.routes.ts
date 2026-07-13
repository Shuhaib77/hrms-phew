import { Router } from 'express';
import { locationsController } from './locations.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createLocationSchema, updateLocationSchema, locationFilterSchema } from './locations.validation.js';

const router = Router();

router.get('/', authenticate, validate({ query: locationFilterSchema }), locationsController.getAll.bind(locationsController));
router.get('/:id', authenticate, locationsController.getById.bind(locationsController));
router.post('/', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: createLocationSchema }), locationsController.create.bind(locationsController));
router.put('/:id', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: updateLocationSchema }), locationsController.update.bind(locationsController));
router.delete('/:id', authenticate, requireRole('ADMIN'), locationsController.delete.bind(locationsController));

export default router;
