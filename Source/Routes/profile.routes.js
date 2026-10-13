import express from 'express';
import profileController from '../Controllers/profile.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

//since we are obtaining userId, we must validate the session to check profile
router.get(
  '/profile/:userId',
  authMiddleware,
  profileController.getProfileByUserId
);

// The user can only edit their own profile, so the id must match the token (r-04)
router.patch(
  '/profile/:userId',
  authMiddleware,
  ownDataOnly,
  profileController.updateProfile
);

export default router;
