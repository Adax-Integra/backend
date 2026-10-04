import express from 'express';
import passwordRecoveryController from '../Controllers/passwordRecovery.controller.js';

const router = express.Router();

//POST /api/password-recovery/forgot-password
router.post('/forgot-password', passwordRecoveryController.forgotPassword);

export default router;
