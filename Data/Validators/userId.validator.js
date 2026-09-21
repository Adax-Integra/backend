const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validationError(message) {
  return new Error(message);
}

class UserIdValidator {
  static validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw validationError('userId is required.');
    }
    if (!UUID_PATTERN.test(userId)) {
      throw validationError('userId must be a valid UUID.');
    }
    return userId;
  }
}

export default UserIdValidator;
