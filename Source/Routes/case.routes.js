import express from 'express';
import caseController from '../Controllers/case.controller.js';

const router = express.Router();

router.get(
  '/cases/:caseId',
  caseController.getCaseById
);
router.get('/cases', caseController.listCases);

export default router;
