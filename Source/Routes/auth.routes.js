import express from 'express';
import authController from '../Controllers/auth.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { authLimiter } from '../Middlewares/rateLimit.middleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authLimiter, authController.login);

// G-09: email verification with a 6 digit code. Rate limited like the login
// because guessing codes is the obvious attack against these endpoints
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post(
  '/resend-verification',
  authLimiter,
  authController.resendVerification
);

router.post('/change-password', authMiddleware, authController.changePassword);

// Requires an active token before revoking it.
router.post('/logout', authMiddleware, authController.logout);

export default router;
