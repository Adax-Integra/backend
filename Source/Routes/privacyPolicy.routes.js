import express from 'express';
import privacyPolicyController from '../Controllers/privacyPolicy.controller.js';

const router = express.Router();

//GET /api/privacy-policy/current
router.get('/privacy-policy/current', privacyPolicyController.getLatest);

export default router;
