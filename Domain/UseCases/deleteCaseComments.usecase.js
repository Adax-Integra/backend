import CommentModel from '../../Data/Models/comment.model.js';
import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import UserIdValidator from '../../Data/Validators/userId.validator.js';

//Errors that carry an HTTP status for the controllers that answer with error.status
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// undo button after saving a comment for US b-02 but only its author can delete it
class DeleteCommentUseCase {
  async execute({ commentId, userId }) {
    const validCommentId = ValidIdValidator.validateId(commentId, 'commentId');
    const validUserId = UserIdValidator.validateUserId(userId);

    const comment = await CommentModel.findById(validCommentId);

    if (!comment) {
      throw httpError(404, `Comment with ID ${validCommentId} not found.`);
    }

    if (comment.user.user_id !== validUserId) {
      throw httpError(403, 'You are not authorized to delete this comment.');
    }

    const deleted = await CommentModel.softDelete(validCommentId);

    // someone could have deleted it between the two queries
    if (!deleted) {
      throw httpError(404, `Comment with ID ${validCommentId} not found.`);
    }
  }
}

export default DeleteCommentUseCase;
