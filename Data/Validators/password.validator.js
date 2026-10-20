const MIN_PASSWORD_LENGTH = 8;
const SPECIAL_CHARACTER_PATTERN = /[\p{P}\p{S}]/u;

class PasswordValidator {
  static hasSpecialCharacter(password) {
    return (
      typeof password === 'string' && SPECIAL_CHARACTER_PATTERN.test(password)
    );
  }

  static validatePassword(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      const error = new Error(
        'La contraseña debe tener al menos 8 caracteres.'
      );
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (!PasswordValidator.hasSpecialCharacter(password)) {
      const error = new Error(
        'La contraseña debe contener al menos un carácter especial.'
      );
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    return password;
  }
}

export default PasswordValidator;
