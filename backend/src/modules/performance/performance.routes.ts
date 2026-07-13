import { Router } from 'express';
import { performanceController } from './performance.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createReviewSchema, selectEOMSchema } from './performance.validation.js';

const router = Router();

router.get('/reviews/:userId', authenticate, performanceController.getReviews.bind(performanceController));
router.post('/reviews', authenticate, requireRole('ADMIN', 'HR_MANAGER', 'MANAGER'), validate({ body: createReviewSchema }), performanceController.createReview.bind(performanceController));
router.get('/eom', authenticate, performanceController.getCurrentEOM.bind(performanceController));
router.get('/eom/history', authenticate, performanceController.getEOMHistory.bind(performanceController));
router.post('/eom/select', authenticate, requireRole('ADMIN'), validate({ body: selectEOMSchema }), performanceController.selectEOM.bind(performanceController));
router.get('/eom/suggestions', authenticate, requireRole('ADMIN'), performanceController.getSuggestions.bind(performanceController));

export default router;
