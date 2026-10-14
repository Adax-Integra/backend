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
      const error = new Error(
        'El correo electrónico no tiene un formato válido.'
      );
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    return trimmedEmail;
  }
}

export default EmailValidator;
