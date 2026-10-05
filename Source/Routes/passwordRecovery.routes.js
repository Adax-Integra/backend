import express from 'express';
import passwordRecoveryController from '../Controllers/passwordRecovery.controller.js';

const router = express.Router();

//POST /api/password-recovery/forgot-password
router.post('/forgot-password', passwordRecoveryController.forgotPassword);

//POST /api/password-recovery/reset-password
router.post('/reset-password', passwordRecoveryController.resetPassword);

export default router;
