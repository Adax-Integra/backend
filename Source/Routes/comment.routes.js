import express from 'express';
import commentController from '../Controllers/comment.controller.js';
import authMiddleware from '../Middlewares/auth.middleware.js';
import { adminInternalOnly } from '../Middlewares/role.middleware.js';

const router = express.Router();

// B-02 allows to create comments on a case but only for internal users

// Adds a comment to a case the author comes from the token
router.post(
  '/cases/:caseId/comments',
  authMiddleware,
  adminInternalOnly,
  commentController.createComment
);

// Lists the comments of a case newest first
router.get(
  '/cases/:caseId/comments',
  authMiddleware,
  adminInternalOnly,
  commentController.getCaseComments
);

// Undo button that makes a soft delete of a comment but only its author can do it
router.delete(
  '/comments/:commentId',
  authMiddleware,
  adminInternalOnly,
  commentController.deleteComment
);

export default router;
