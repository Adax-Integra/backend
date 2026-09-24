import express from 'express';
import caseController from '../Controllers/case.controller.js';

const router = express.Router();

router.get('/cases/:caseId', caseController.getCaseById);
router.get('/cases', caseController.listCases);
router.get('/users/:userId/cases', caseController.getCasesByUser);

export default router;
