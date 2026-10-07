import CommentModel from '../../Data/Models/comment.model.js';
import ValidIdValidator from '../../Data/Validators/validId.validator.js';

// Errors that carry an HTTP status for the controllers that answer with error.status
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// List the comments of a case, newest first specifically for US B-02
class GetCaseCommentsUseCase {
  async execute({ caseId, limit }) {
    const validCaseId = ValidIdValidator.validateId(caseId, 'caseId');

    // Limit is optional, so if missing the model default applies
    let parsedLimit;
    if (limit !== undefined) {
      parsedLimit = Number(limit);

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 50
      ) {
        throw httpError(400, 'limit must be an integer between 1 and 50.');
      }
    }

    if (!(await CommentModel.caseExists(validCaseId))) {
      throw httpError(404, `Case with ID ${validCaseId} not found.`);
    }

    return await CommentModel.findByCaseId(validCaseId, {
      limit: parsedLimit,
    });
  }
}

export default GetCaseCommentsUseCase;
