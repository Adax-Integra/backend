import express from 'express';
import internalUserController from '../Controllers/internalUser.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// V-10 Get all of the cases from a specific record/user
router.get(
  '/internal-users/:userId/allCases',
  authMiddleware,
  adminInternalOnly,
  internalUserController.getAllCasesFromUser
);

// R-03 Register a new external user's expediente
router.post(
  '/internal-users/external-users',
  authMiddleware,
  adminInternalOnly,
  internalUserController.registerExternalUser
);

export default router;
