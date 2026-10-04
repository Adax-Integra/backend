import express from 'express';
import externalUserController from '../Controllers/externalUser.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';
import preSubmissionUpload from '../Middlewares/upload.middleware.js';

const router = express.Router();

// G-01 sends registration requests to the account creation controller
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
  preSubmissionUpload,
  externalUserController.editPreSubmissionData
);

//R-02 Create a case once the user confirmed her data in R-01
router.post(
  '/external-users/:userId/cases',
  authMiddleware,
  ownDataOnly,
  externalUserController.createCase
);

export default router;
