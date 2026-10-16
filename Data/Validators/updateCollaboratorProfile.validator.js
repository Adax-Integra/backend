import EmailValidator from './email.validator.js';
import RequiredStringValidator from './requiredString.validator.js';

const ALLOWED_PROFILE_KEYS = ['name', 'last_name', 'email'];

const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 128;

function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

class UpdateCollaboratorProfileValidator {
  static validateUpdateBody(body = {}) {
    if (!isPlainObject(body)) {
      throw validationError({ body: 'Request body must be an object' });
    }

    if (!isPlainObject(body.profile)) {
      throw validationError({ profile: 'profile must be an object' });
    }

    const errors = {};
    const profile = {};

    for (const key of Object.keys(body.profile)) {
      if (!ALLOWED_PROFILE_KEYS.includes(key)) {
        errors[`profile.${key}`] = `profile.${key} cannot be modified`;
      }
    }

    if (body.profile.name !== undefined) {
      try {
        const name = RequiredStringValidator.validateRequiredString(
          body.profile.name,
          'name'
        );
        if (name.length > MAX_NAME_LENGTH) {
          errors['profile.name'] =
            `name must be at most ${MAX_NAME_LENGTH} characters`;
        } else {
          profile.name = name;
        }
      } catch (error) {
        errors['profile.name'] = error.message;
      }
    }

    if (body.profile.last_name !== undefined) {
      try {
        const lastName = RequiredStringValidator.validateRequiredString(
          body.profile.last_name,
          'last_name'
        );

        if (lastName.length > MAX_NAME_LENGTH) {
          errors['profile.last_name'] =
            `last_name must be at most ${MAX_NAME_LENGTH} characters`;
        } else {
          profile.last_name = lastName;
        }
      } catch (error) {
        errors['profile.last_name'] = error.message;
      }
    }

    if (body.profile.email !== undefined) {
      try {
        const email = EmailValidator.validateEmail(
          body.profile.email
        ).toLowerCase();
        if (email.length > MAX_EMAIL_LENGTH) {
          errors['profile.email'] =
            `email must be at most ${MAX_EMAIL_LENGTH} characters`;
        } else {
          profile.email = email;
        }
      } catch (error) {
        errors['profile.email'] = error.message;
      }
    }

    if (Object.keys(errors).length === 0 && Object.keys(profile).length === 0) {
      errors.profile = 'At least one of name, last_name or email is required';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return { profile };
  }
}

export default UpdateCollaboratorProfileValidator;
