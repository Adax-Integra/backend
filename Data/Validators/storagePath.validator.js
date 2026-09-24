import RequiredStringValidator from './requiredString.validator.js';

function validationError(message) {
  return new Error(message);
}

class StoragePathValidator {
  static validateStoragePath(value, userId, fieldName) {
    const path = RequiredStringValidator.validateRequiredString(
      value,
      fieldName
    );
    if (userId && !path.startsWith(`${userId}/`)) {
      throw validationError(`${fieldName} path must start with "${userId}/".`);
    }
    return path;
  }
}

export default StoragePathValidator;
