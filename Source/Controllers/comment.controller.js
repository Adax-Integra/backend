import CreateCommentUseCase from '../../Domain/UseCases/createComment.usecase.js';
import GetCaseCommentsUseCase from '../../Domain/UseCases/getCaseComments.usecase.js';
import DeleteCaseCommentsUseCase from '../../Domain/UseCases/deleteCaseComments.usecase.js';
import CommentDTO from '../DTOs/comment.dto.js';

const createCommentUseCase = new CreateCommentUseCase();
const getCaseCommentsUseCase = new GetCaseCommentsUseCase();
const deleteCaseCommentsUseCase = new DeleteCaseCommentsUseCase();

// Expected errors carry an HTTP status (400, 403, 404) anything else defaults to 500
function sendError(res, error, logMessage, fallbackMessage) {
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      error: error.message,
    });
  }

  console.error(logMessage, error);

  return res.status(500).json({
    success: false,
    error: fallbackMessage,
  });
}

class CommentController {
  // POST method for creating comments for US B-02
  async createComment(req, res) {
    try {
      const { caseId } = req.params;
      const body = req.body || {};

      const comment = await createCommentUseCase.execute({
        caseId,
        userId: req.user.user_id,
        content: body.content,
      });

      return res.status(201).json({
        success: true,
        data: new CommentDTO(comment),
      });
    } catch (error) {
      return sendError(
        res,
        error,
        'Failed to create comment:',
        'Unable to create comment.'
      );
    }
  }

  // GET method for listing comments of a case for US B-02
  async getCaseComments(req, res) {
    try {
      const { caseId } = req.params;
      const { limit } = req.query;

      const comments = await getCaseCommentsUseCase.execute({
        caseId,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: comments.map((comment) => new CommentDTO(comment)),
      });
    } catch (error) {
      return sendError(
        res,
        error,
        'Failed to get comments:',
        'Unable to retrieve comments.'
      );
    }
  }

  // DELETE method for deleting a comment of a case for US B-02
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;

      await deleteCaseCommentsUseCase.execute({
        commentId,
        userId: req.user.user_id,
      });

      return res.status(204).send();
    } catch (error) {
      return sendError(
        res,
        error,
        'Failed to delete comment:',
        'Unable to delete comment.'
      );
    }
  }
}

export default new CommentController();
