import express from 'express';
import recordController from '../Controllers/record.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// Authenticate before checking permission to list all records.
router.get(
  '/records',
  authMiddleware,
  adminInternalOnly,
  recordController.listRecords
);

export default router;
