import express from 'express';
import internalUserController from '../Controllers/internalUser.controller.js';

const router = express.Router();

// V-10 Get all of the cases from a specific record
router.get(
  '/internal-users/:userId/allCases',
  internalUserController.getPreSubmissionData
);

export default router;
