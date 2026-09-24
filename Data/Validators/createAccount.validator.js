// Created by Lakshmi Jara on 23/09/26.
// G-01

import EmailValidator from './email.validator.js';
import PhoneValidator from './phone.validator.js';
import RequiredStringValidator from './requiredString.validator.js';

const COUNTRY_CODE_PATTERN = /^\+\d{1,3}$/;
const PHONE_NUMBER_PATTERN = /^\d{10}$/;
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
      typeof body.country_code !== 'string' ||
      !COUNTRY_CODE_PATTERN.test(body.country_code)
    ) {
      throw new Error('country_code must be valid country code.');
    }

    if (
      typeof body.phone !== 'string' ||
      !PHONE_NUMBER_PATTERN.test(body.phone)
    ) {
      throw new Error('phone must contain exactly 10 digits.');
    }

    // store the phone with its country code
    const phone = PhoneValidator.validatePhone(
      `${body.country_code}${body.phone}`
    );

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
      phone,
      password: body.password,
    };
  }
}

export default CreateAccountValidator;
