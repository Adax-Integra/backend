//A missing or blank value is always a client error, so it carries a 400
//status for the controllers that answer with error.status
function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
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
