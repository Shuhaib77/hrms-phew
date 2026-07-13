import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from './auth.validation.js';

const router = Router();

router.post('/register', authenticate, requireRole('ADMIN'), validate({ body: registerSchema }), authController.register.bind(authController));
router.post('/login', validate({ body: loginSchema }), authController.login.bind(authController));
router.get('/me', authenticate, authController.getProfile.bind(authController));
router.put('/profile', authenticate, validate({ body: updateProfileSchema }), authController.updateProfile.bind(authController));
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword.bind(authController));

export default router;
