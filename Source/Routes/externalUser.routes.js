import express from 'express';
import externalUserController from '../Controllers/externalUser.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';
import {
  registerLimiter,
  createCaseLimiter,
} from '../Middlewares/rateLimit.middleware.js';

const router = express.Router();

// G-01 sends registration requests to the account creation controller
router.post(
  '/external-user/register',
  registerLimiter,
  externalUserController.createAccount
);

//R-02 Create a case
router.post(
  '/external-users/:userId/cases',
  authMiddleware,
  ownDataOnly,
  createCaseLimiter,
  externalUserController.createCase
);

export default router;
