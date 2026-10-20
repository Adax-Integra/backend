import express from 'express';
import profileController from '../Controllers/profile.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// Validate the session to check profile, like PATCH the id must match the token (g-13)
router.get(
  '/profile/:userId',
  authMiddleware,
  ownDataOnly,
  profileController.getProfileByUserId
);

// Profile fields shown in the edit view, the id must match the token like PATCH (r-04)
router.get(
  '/profile/:userId/edit',
  authMiddleware,
  ownDataOnly,
  profileController.getEditableProfile
);

// The user can only edit their own profile, so the id must match the token (r-04)
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
