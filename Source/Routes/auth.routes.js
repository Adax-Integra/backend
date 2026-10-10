import express from 'express';
import authController from '../Controllers/auth.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.login);

// G-09: email verification with a 6 digit code
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

router.post('/change-password', authMiddleware, authController.changePassword);

export default router;
