import RequiredStringValidator from './requiredString.validator.js';

class NameValidator {
  static validateNameOrLastName(value) {
    return RequiredStringValidator.validateRequiredString(
      value,
      'name or last name'
    );
  }
}

export default NameValidator;
