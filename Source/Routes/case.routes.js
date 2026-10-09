import express from 'express';
import caseController from '../Controllers/case.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// Gets the list of cases
// Only admin and internal users can access it
router.get(
  '/cases',
  authMiddleware,
  adminInternalOnly,
  caseController.listCases
);

// Gets a specific case by its ID
// Only admin and internal users can access it
router.get(
  '/cases/:caseId',
  authMiddleware,
  adminInternalOnly,
  caseController.getCaseById
);

// Updates the state of a case to "Closed" if it is not already closed (V-11)
// Only admin and internal users can access it
router.patch(
  '/cases/:caseId/close',
  authMiddleware,
  adminInternalOnly,
  caseController.closeCase
);

// Gets the cases of a user (used by the external user's own case list)
router.get('/users/:userId/cases', caseController.getCasesByUser);

export default router;
