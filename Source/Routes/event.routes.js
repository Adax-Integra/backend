import express from 'express';
import eventController from '../Controllers/event.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';
import { createEventLimiter } from '../Middlewares/rateLimit.middleware.js';
import { eventImageUploadMiddleware } from '../Middlewares/upload.middleware.js';

const router = express.Router();

router.get('/events', authMiddleware, eventController.getActiveEvents);

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

// Update an event's details, internal/admin only
router.put(
  '/events/:eventId',
  authMiddleware,
  adminInternalOnly,
  eventController.updateEvent
);

// Upload or replace the event image, internal/admin only
router.patch(
  '/events/:eventId/image',
  authMiddleware,
  adminInternalOnly,
  eventImageUploadMiddleware,
  eventController.uploadEventImage
);

export default router;
