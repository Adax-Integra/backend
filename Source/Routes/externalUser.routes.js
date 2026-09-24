import express from 'express';
import externalUserController from '../Controllers/externalUser.controller.js';

const router = express.Router();

// G-01 create a new external user account
router.post('/external-user/register', externalUserController.createAccount);

router.get(
  '/external-users/:userId/pre-submission',
  externalUserController.getPreSubmissionData
);

router.put(
  '/external-users/:userId/pre-submission',
  externalUserController.editPreSubmissionData
);

export default router;
