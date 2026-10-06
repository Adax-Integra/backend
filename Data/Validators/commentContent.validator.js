import RequiredStringValidator from './requiredString.validator';
const MAX_COMMENT_LENGTH = 5000;

//Too long a comment is a client error, so it carries a 400 status
function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}
//Validates the text of a comment (B-02): 1 to 5000 characters once trimmed
class CommentContentValidator {
  static validateContent(value) {
    const content = RequiredStringValidator.validateRequiredString(
      value,
      'content'
    );

    if (content.length > MAX_COMMENT_LENGTH) {
      throw validationError(
        `content cannot be longer than ${MAX_COMMENT_LENGTH} characters.`
      );
    }

    return content;
  }
}

export default CommentContentValidator;
