import express from 'express';
import profileController from '../Controllers/profile.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';

const router = express.Router();

//since we are obtaining userId, we must validate the session to check profile
router.get(
  '/profile/:userId',
  authMiddleware,
  profileController.getProfileByUserId
);

export default router;
