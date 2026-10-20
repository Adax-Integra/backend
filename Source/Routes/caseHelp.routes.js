import express from 'express';
import caseHelpController from '../Controllers/caseHelp.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// R-08: only internal users and admins organize the helps of a case

//Help types catalog — internal/admin only
router.get(
  '/help-types',
  authMiddleware,
  adminInternalOnly,
  caseHelpController.listHelpTypes
);

//Replace the helps assigned to a case — internal/admin only
router.put(
  '/cases/:caseId/helps',
  authMiddleware,
  adminInternalOnly,
  caseHelpController.assignCaseHelps
);

export default router;
