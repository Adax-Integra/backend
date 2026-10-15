import express from 'express';
import eventController from '../Controllers/event.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';
import { createEventLimiter } from '../Middlewares/rateLimit.middleware.js';

const router = express.Router();

// Register an event, internal/admin only
router.post(
  '/events',
  authMiddleware,
  adminInternalOnly,
  createEventLimiter,
  eventController.createEvent
);
// Disable an event, internal/admin only
router.patch(
  '/events/:eventId/disable',
  authMiddleware,
  adminInternalOnly,
  eventController.disableEvent
);

export default router;
