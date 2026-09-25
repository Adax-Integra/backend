const PHONE_PATTERN = /^\+\d{1,3}\d{10}$/;

function validationError(message) {
  return new Error(message);
}

class PhoneValidator {
  static validatePhone(phone) {
    if (typeof phone !== 'string' || !PHONE_PATTERN.test(phone)) {
      throw validationError('phone must be a valid phone number.');
    }
    return phone;
  }
}

export default PhoneValidator;
