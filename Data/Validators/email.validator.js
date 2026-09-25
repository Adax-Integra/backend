const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationError(message) {
  return new Error(message);
}

class EmailValidator {
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw validationError('email is required.');
    }
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      throw validationError('email must be a valid email address.');
    }
    return trimmedEmail;
  }
}

export default EmailValidator;
