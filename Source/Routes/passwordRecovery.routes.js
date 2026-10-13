import express from 'express';
import passwordRecoveryController from '../Controllers/passwordRecovery.controller.js';
import { authLimiter } from '../Middlewares/rateLimit.middleware.js';
//add rate limit middleware

const router = express.Router();

//POST /api/password-recovery/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  passwordRecoveryController.forgotPassword
);

//POST /api/password-recovery/reset-password
router.post(
  '/reset-password',
  authLimiter,
  passwordRecoveryController.resetPassword
);

export default router;
