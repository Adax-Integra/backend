import NameValidator from './name.validator.js';
import PhoneValidator from './phone.validator.js';
import RequiredStringValidator from './requiredString.validator.js';

// Columns of the user table
const PROFILE_VALIDATORS = {
  name: (value) => NameValidator.validateNameOrLastName(value),
  last_name: (value) => NameValidator.validateNameOrLastName(value),
  phone: (value) => PhoneValidator.validatePhone(value),
};

// Columns of the address table
const ADDRESS_VALIDATORS = {
  country: (value) =>
    RequiredStringValidator.validateRequiredString(value, 'country'),
  state: (value) =>
    RequiredStringValidator.validateRequiredString(value, 'state'),
  municipality: (value) =>
    RequiredStringValidator.validateRequiredString(value, 'municipality'),
};

/* 
R-04: fields each kind of user can change on their own profile.
The email is never editable here for any role, so it is rejected.
*/
export const STAFF_EDITABLE_FIELDS = ['name', 'last_name', 'phone'];
export const EXTERNAL_EDITABLE_FIELDS = [
  'name',
  'last_name',
  'phone',
  'country',
  'state',
  'municipality',
];

function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

class UpdateProfileValidator {
  // Splits the flat body into the user and address columns to update
  static validateUpdateBody(body, editableFields) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError({ body: 'Request body must be an object' });
    }

    const errors = {};
    const profile = {};
    const address = {};

    for (const key of Object.keys(body)) {
      if (!editableFields.includes(key)) {
        errors[key] = `${key} cannot be modified`;
        continue;
      }

      const target = Object.hasOwn(PROFILE_VALIDATORS, key) ? profile : address;
      const validate = PROFILE_VALIDATORS[key] ?? ADDRESS_VALIDATORS[key];
      try {
        target[key] = validate(body[key]);
      } catch (error) {
        errors[key] = error.message;
      }
    }

    if (
      Object.keys(errors).length === 0 &&
      Object.keys(profile).length === 0 &&
      Object.keys(address).length === 0
    ) {
      errors.body = 'At least one field is required';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return { profile, address };
  }
}

export default UpdateProfileValidator;
