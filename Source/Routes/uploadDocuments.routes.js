import express from 'express';
import uploadDocumentsController from '../Controllers/uploadDocuments.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { ownDataOnly } from '../Middlewares/role.middleware.js';
import preSubmissionUpload from '../Middlewares/upload.middleware.js';

const router = express.Router();

// R-06: The owner sees which documents are already uploaded.
router.get(
  '/external-users/:userId/documents',
  authMiddleware,
  ownDataOnly,
  uploadDocumentsController.getDocuments
);

// R-06: Upload or replace identity documents for the authenticated owner.
router.patch(
  '/external-users/:userId/documents',
  authMiddleware,
  ownDataOnly,
  preSubmissionUpload,
  uploadDocumentsController.uploadDocuments
);

//R-06 / V-13: download a document decrypted. The token is a signed link
//that expires after 5 minutes, created by the two routes above or by V-13.
router.get(
  '/documents/files/:token',
  uploadDocumentsController.getDocumentFile
);

export default router;
