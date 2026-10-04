import express from 'express';
import authMiddleware from '../Middlewares/auth.middleware.js';
import adminInternalOnly from '../Middlewares/role.middleware.js';
import reportsController from '../Controllers/reports.controller.js';

const router = express.Router();

// V-08 Get the CSV of the report for a specific date range
router.get(
  '/reports/export',
  authMiddleware,
  adminInternalOnly,
  reportsController.getReportCsv
);

export default router;
