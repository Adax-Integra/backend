import EmailValidator from './email.validator.js';
import RequiredStringValidator from './requiredString.validator.js';

const MIN_PASSWORD_LENGTH = 8;

// checks the registration data before the account is created
class CreateAccountValidator {
  static validateBody(body = {}) {
    // rejects null, arrays, and values that are not objects
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Request body must be an object.');
    }

    // validate the required personal info
    const name = RequiredStringValidator.validateRequiredString(
      body.name,
      'name'
    );

    const lastName = RequiredStringValidator.validateRequiredString(
      body.last_name,
      'last_name'
    );

    // checks the email format and coverts it to lowercase
    const email = EmailValidator.validateEmail(body.email).toLowerCase();

    const phone = RequiredStringValidator.validateRequiredString(
      body.phone,
      'phone'
    );

    // acepts extactly 10 digits, with no spaces, letters or symbols
    if (!/^\d{10}$/.test(phone)) {
      throw new Error('phone must contain exactly 10 digits.');
    }

    // checks that the passwords is text and has at least 8 characters
    if (
      typeof body.password !== 'string' ||
      body.password.length < MIN_PASSWORD_LENGTH
    ) {
      throw new Error('password must contain at least 8 characters.');
    }

    // makes sure the user entered the same password twice
    if (body.password !== body.confirm_password) {
      throw new Error('password and confirm_password must match.');
    }

    return {
      name,
      lastName,
      email,
      phone,
      password: body.password,
    };
  }
}

export default CreateAccountValidator;
