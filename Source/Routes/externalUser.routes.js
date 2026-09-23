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

//R-02 Create a caso once the user confirmed her data in R-01
router.post('/external-users/:userId/cases', externalUserController.createCase);

export default router;
