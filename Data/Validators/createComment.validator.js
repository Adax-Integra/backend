import CommentModel from '../../Data/Models/comment.model.js';
import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import UserIdValidator from '../../Data/Validators/userId.validator.js';
import CommentContentValidator from '../../Data/Validators/commentContent.validator.js';

// add comment to a case (B-02); the author comes from the token
class CreateCommentUseCase {
  async execute({ caseId, userId, content }) {
    const validCaseId = ValidIdValidator.validateId(caseId, 'caseId');
    const validUserId = UserIdValidator.validateUserId(userId);
    const validContent = CommentContentValidator.validateContent(content);

    if (!(await CommentModel.caseExists(validCaseId))) {
      const error = new Error(`Case with ID ${validCaseId} not found.`);
      error.status = 404;
      throw error;
    }

    return await CommentModel.create({
      caseId: validCaseId,
      userId: validUserId,
      content: validContent,
    });
  }
}

export default CreateCommentUseCase;
