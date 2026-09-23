function validationError(message) {
  return new Error(message);
}

class RequiredStringValidator {
  static validateRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw validationError(`${fieldName} must be a non-empty string.`);
    }
    return value.trim();
  }
}

export default RequiredStringValidator;
