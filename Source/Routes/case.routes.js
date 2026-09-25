import express from 'express';
import caseController from '../Controllers/case.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import {
  adminInternalOnly,
  ownDataOnly,
} from '../Middlewares/role.middleware.js';

const router = express.Router();

// Gets a specific case by its ID
// Only admin and internal users can access it

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

// Gets the cases of a specific user
// Only the owner of the data or admin/internal users can access it
router.get(
  '/users/:userId/cases',
  authMiddleware,
  ownDataOnly,
  caseController.getCasesByUser
);

export default router;
