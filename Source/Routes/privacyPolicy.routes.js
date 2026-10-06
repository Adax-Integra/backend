import express from 'express';
import privacyPolicyController from '../Controllers/privacyPolicy.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';

const router = express.Router();

//GET /api/privacy-policy/current
router.get('/privacy-policy/current', privacyPolicyController.getLatest);

// POST /api/privacy-policy/consent
router.post(
  '/privacy-policy/consent',
  authMiddleware,
  privacyPolicyController.registerConsent
);

// GET /api/privacy-policy/consent
router.get(
  '/privacy-policy/consent',
  authMiddleware,
  privacyPolicyController.getConsentStatus
);

export default router;
