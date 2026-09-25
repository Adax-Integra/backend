import express from 'express';
import externalUserController from '../Controllers/externalUser.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// G-01 create a new external user account
router.post('/external-user/register', externalUserController.createAccount);

// Gets the pre-submission data from an external user
router.get(
  '/external-users/:userId/pre-submission',
  authMiddleware,
  ownDataOnly,
  externalUserController.getPreSubmissionData
);

// Updates the pre-submission data from an external user
router.put(
  '/external-users/:userId/pre-submission',
  authMiddleware,
  ownDataOnly,
  externalUserController.editPreSubmissionData
);

//R-02 Create a caso once the user confirmed her data in R-01
router.post('/external-users/:userId/cases', externalUserController.createCase);

export default router;
