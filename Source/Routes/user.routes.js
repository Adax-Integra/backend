import express from 'express';
import userController from '../Controllers/user.controller.js';

const router = express.Router();

router.get(
  '/users/:userId/pre-submission',
  userController.getPreSubmissionData
);

export default router;
