import CommentModel from '../../Data//Models/comment.model.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CONTENT_LENGTH = 5000;

// Builds an error that the controller can turn into an HTTP response
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class CreateCommentUseCase {
  // Saves a comment on a valid case
  async execute({ caseId, userId, content }) {
    if (typeof caseId !== 'string' || !UUID_REGEX.test(caseId)) {
      throw httpError(400, 'caseId must be a valid UUID.');
    }

    if (typeof content !== 'string') {
      throw httpError(400, 'content must be a string.');
    }

    // Spaces at the ends do not count as content
    const cleanContent = content.trim();

    if (cleanContent.length < 1) {
      throw httpError(400, 'content must have at least 1 character.');
    }

    if (cleanContent.length > MAX_CONTENT_LENGTH) {
      throw httpError(
        400,
        `content cannot be longer than ${MAX_CONTENT_LENGTH} characters.`
      );
    }

    if (!(await CommentModel.caseExists(caseId))) {
      throw httpError(404, `Case with ID ${caseId} not found.`);
    }

    return CommentModel.create({ caseId, userId, content: cleanContent });
  }
}

export default CreateCommentUseCase;
