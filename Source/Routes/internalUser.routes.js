import express from 'express';
import internalUserController from '../Controllers/internalUser.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import {
  adminInternalOnly,
  adminOnly,
} from '../Middlewares/role.middleware.js';
import { createCaseLimiter } from '../Middlewares/rateLimit.middleware.js';

const router = express.Router();

// V-10 Get all of the cases from a specific record/user
router.get(
  '/internal-users/:userId/allCases',
  authMiddleware,
  adminInternalOnly,
  internalUserController.getAllCasesFromUser
);

// R-11 Create a case for an external user from an internal account
router.post(
  '/internal-users/external-users/:userId/cases',
  authMiddleware,
  adminInternalOnly,
  createCaseLimiter,
  internalUserController.createCaseForExternalUser
);

// R-03 Register a new external user's expediente
router.post(
  '/internal-users/external-users',
  authMiddleware,
  adminInternalOnly,
  internalUserController.registerExternalUser
);

// G-16 Admin consults the list of external accounts
router.get(
  '/internal-users/external-users',
  authMiddleware,
  adminOnly,
  internalUserController.listExternalUsers
);

// G-07 Get the personal data of an external user (admin only)
router.get(
  '/internal-users/external-users/:userId',
  authMiddleware,
  adminOnly,
  internalUserController.getExternalProfile
);

// G-07 Update the text data of an external user (admin only)
router.patch(
  '/internal-users/external-users/:userId',
  authMiddleware,
  adminOnly,
  internalUserController.updateExternalProfile
);

// V-13 Internal users view the documents of an external user's record
router.get(
  '/internal-users/external-users/:userId/documents',
  authMiddleware,
  adminInternalOnly,
  internalUserController.getExternalUserDocuments
);

// G-03 Admin creates a new collaborator (internal user) account
router.post(
  '/internal-users',
  authMiddleware,
  adminOnly,
  internalUserController.createCollaborator
);

// V-06 Admin consults the activity log of the system
router.get(
  '/internal-users/activity-log',
  authMiddleware,
  adminOnly,
  internalUserController.listActivityLog
);

// G-06 Admin consults the list of collaborators (internal users)
router.get(
  '/internal-users',
  authMiddleware,
  adminOnly,
  internalUserController.listCollaborators
);
// G-10 Admin and ONLY ADMIN  consults the detail of a internal user
router.get(
  '/internal-users/:userId',
  authMiddleware,
  adminOnly,
  internalUserController.getCollaboratorDetail
);

// G-10 Admin and ONLY ADMIN consults the detail of a collaborator
router.get(
  '/internal-users/:userId',
  authMiddleware,
  adminOnly,
  internalUserController.getCollaboratorDetail
);

// G-10 Admin consults the cases assigned to a collaborator
router.get(
  '/internal-users/:userId/assigned-cases',
  authMiddleware,
  adminOnly,
  internalUserController.getCollaboratorCases
);

// G-04 Admin activates or deactivates a collaborator account
router.patch(
  '/internal-users/:userId/status',
  authMiddleware,
  adminOnly,
  internalUserController.updateCollaboratorStatus
);

export default router;
