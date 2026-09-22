function validationError(message) {
  return new Error(message);
}

class NameValidator {
  static validateNameOrLastName(value) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw validationError('name or last name must be a non-empty string.');
    }
    return value.trim();
  }
}

export default NameValidator;
