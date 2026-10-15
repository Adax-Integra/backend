import express from 'express';
import profileController from '../Controllers/profile.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

/* 
Validate the session to check profile
like patch, the id must match the token (R-04)
*/
router.get(
  '/profile/:userId',
  authMiddleware,
  ownDataOnly,
  profileController.getProfileByUserId
);

// The user can only edit their own profile, so the id must match the token (R-04)
router.patch(
  '/profile/:userId',
  authMiddleware,
  ownDataOnly,
  profileController.updateProfile
);

// The user can only deactivate her own account, so the id must match the token (G-08)
router.patch(
  '/profile/:userId/deactivate',
  authMiddleware,
  ownDataOnly,
  profileController.deactivateAccount
);

export default router;
