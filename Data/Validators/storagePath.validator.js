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

    // Block paths like "{userId}/../{otherUserId}/file.pdf"
    /* 
    This is to prevent people from accessing other user identity docs,
    if they get to know other users' ids"
    */
    const segments = path.split('/');
    const hasInvalidSegment = segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..'
    );

    if (path.includes('\\') || hasInvalidSegment) {
      throw validationError(`${fieldName} contains an invalid path.`);
    }

    return path;
  }
}

export default StoragePathValidator;
