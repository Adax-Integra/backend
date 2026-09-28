// Created by Lakshmi Jara on 23/09/26.
// G-01

import EmailValidator from './email.validator.js';
import RequiredStringValidator from './requiredString.validator.js';

const MIN_PASSWORD_LENGTH = 8;

class CreateAccountValidator {
  static validateBody(body = {}) {
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

    const email = EmailValidator.validateEmail(body.email).toLowerCase();

    if (
      typeof body.password !== 'string' ||
      body.password.length < MIN_PASSWORD_LENGTH
    ) {
      throw new Error('password must contain at least 8 characters.');
    }

    // make sure the user entered the same password twice
    if (body.password !== body.confirm_password) {
      throw new Error('password and confirm_password must match.');
    }

    return {
      name,
      lastName,
      email,
      password: body.password,
    };
  }
}

export default CreateAccountValidator;
