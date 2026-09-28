import express from 'express';
import caseController from '../Controllers/case.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// Gets a specific case by its ID
// Only admin and internal users can access it

router.get('/cases/:caseId', caseController.getCaseById);
router.get('/cases', caseController.listCases);
router.get('/users/:userId/cases', caseController.getCasesByUser);
router.get(
  '/cases/:caseId',
  authMiddleware,
  adminInternalOnly,
  caseController.getCaseById
);

// Gets the list of cases
// Only admin and internal users can access it

router.get(
  '/cases',
  authMiddleware,
  adminInternalOnly,
  caseController.listCases
);

export default router;
