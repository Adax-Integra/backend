import express from 'express';
import uploadDocumentsController from '../Controllers/uploadDocuments.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';
import preSubmissionUpload from '../Middlewares/upload.middleware.js';

const router = express.Router();

// R-06: Upload or replace identity documents for the authenticated owner.
router.patch(
  '/external-users/:userId/documents',
  authMiddleware,
  ownDataOnly,
  preSubmissionUpload,
  uploadDocumentsController.uploadDocuments
);

export default router;
