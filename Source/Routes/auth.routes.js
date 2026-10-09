import express from 'express';
import authController from '../Controllers/auth.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { authLimiter } from '../Middlewares/rateLimit.middleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authLimiter, authController.login);
router.post('/change-password', authMiddleware, authController.changePassword);

export default router;
