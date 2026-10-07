import express from 'express';
import authController from '../Controllers/auth.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, authController.changePassword);

export default router;
