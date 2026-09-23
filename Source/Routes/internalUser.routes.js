import express from 'express';
import internalUserController from '../Controllers/internalUser.controller.js';

const router = express.Router();

// V-10 Get all of the cases from a specific record/user
router.get(
  '/internal-users/:userId/allCases',
  internalUserController.getAllCasesFromUser
);

// R-03 Register a new external user's expediente
router.post(
  '/internal-users/external-users',
  internalUserController.registerExternalUser
);

export default router;
