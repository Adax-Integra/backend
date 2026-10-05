const MIN_PASSWORD_LENGTH = 8;

class PasswordValidator {
  // checks that the passwords is text and has at least 8 characters
  static validatePassword(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      throw new Error('password must contain at least 8 characters.');
    }
    return password;
  }
}

export default PasswordValidator;
