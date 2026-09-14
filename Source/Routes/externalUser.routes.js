import express from 'express';
import externalUserController from '../Controllers/externalUser.controller.js';

const router = express.Router();

router.get(
  '/external-users/:userId/pre-submission',
  externalUserController.getPreSubmissionData
);

router.put(
  '/external-users/:userId/pre-submission',
  externalUserController.editPreSubmissionData
);

export default router;
