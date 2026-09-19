import express from 'express';
import caseController from '../Controllers/case.controller.js';

const router = express.Router();

router.get(
  '/cases/:caseId',
  caseController.getCaseById
);

router.put(
  '/case-progress/:caseId/pre-submission',
  caseController.editPreSubmissionData
);

export default router;
