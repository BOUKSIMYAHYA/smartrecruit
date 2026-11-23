import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Profile & Password
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, AuthController.changePassword);

// Login & Registration
router.post('/login', AuthController.login);
router.post('/register', AuthController.registerCandidate);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-code', AuthController.resendCode);

// Dev / Demo quick login
router.post('/dev-login', AuthController.devLogin);

export default router;
