import express from 'express';
import userController from '../Controllers/user.controller.js';

const router = express.Router();

router.get(
  '/users/:userId/pre-submission',
  userController.getPreSubmissionData
);

router.put(
  '/users/:userId/pre-submission',
  userController.editPreSubmissionData
);

export default router;
