import express from 'express';
import caseController from '../Controllers/case.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import {
  adminInternalOnly,
  ownDataOnly,
} from '../Middlewares/role.middleware.js';

const router = express.Router();

//Every case route requires a token; Listing and closing cases are staff-only
// users read their own cases through /users/:userId/cases, guarded by ownDataOnly

//List all cases — internal/admin only
router.get(
  '/cases',
  authMiddleware,
  adminInternalOnly,
  caseController.listCases
);

// V-12: Cases assigned to the logged-in collaborator, open and closed.
// Must stay before /cases/:caseId so "assigned" is not read as a caseId
router.get(
  '/cases/assigned',
  authMiddleware,
  adminInternalOnly,
  caseController.listAssignedCases
);

/* 
R-10: Accounts that can be assigned to a case, internal/admin only.
*/
router.get(
  '/cases/collaborators',
  authMiddleware,
  adminInternalOnly,
  caseController.listAssignableCollaborators
);

//Case details: any authenticated user (the owner sees it in V-07,
// staff can see any case). A per-case ownership check is a recommended
// follow-up, for now, a valid token is enough
router.get('/cases/:caseId', authMiddleware, caseController.getCaseById);

//Cases for a specific user, only the owner of that userId
router.get(
  '/users/:userId/cases',
  authMiddleware,
  ownDataOnly,
  caseController.getCasesByUser
);

//Close a case (V-11) — internal/admin only (see "ANTES DE EMPEZAR", item 2)
router.patch(
  '/cases/:caseId/close',
  authMiddleware,
  adminInternalOnly,
  caseController.closeCase
);

// List available violence types (R-07), internal/admin only
router.get(
  '/violence-types',
  authMiddleware,
  adminInternalOnly,
  caseController.listViolenceTypes
);

// Assign violence types to a case (R-07), internal/admin only
router.patch(
  '/cases/:caseId/violence-types',
  authMiddleware,
  adminInternalOnly,
  caseController.assignViolenceTypes
);
// Assign an internal or admin user to a case (R-10)
router.post(
  '/cases/:caseId/assignments',
  authMiddleware,
  adminInternalOnly,
  caseController.assignCollaborator
);

//r-13 updates case steps
// Assign an internal or admin user to a case (R-10)
router.patch(
  '/cases/:caseId/steps',
  authMiddleware,
  adminInternalOnly,
  caseController.updateCaseStep
);

export default router;
