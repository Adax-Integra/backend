/* G-07: Only the admin can change the text data of an external user.
Name, last name and birth date were used to create the account, so the 
associate asked to keep them fixed. Documents are out of this user story.
*/
import EmailValidator from './email.validator.js';
import PhoneValidator from './phone.validator.js';
import RequiredStringValidator from './requiredString.validator.js';

const LOCKED_PROFILE_KEYS = ['name', 'last_name', 'birth_date'];
const ADDRESS_KEYS = [
  'address_line_1',
  'address_line_2',
  'neighborhood',
  'zip_code',
  'country',
  'state',
  'city',
];
// Enough for a short explanation without filling the log with long texts
const MAX_REASON_LENGTH = 500;

// Same shape as createCase.validator so the app can highlight each field
function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

class UpdateExternalProfileValidator {
  static validateUpdateBody(body = {}) {
    if (!isPlainObject(body)) {
      throw validationError({ body: 'Request body must be an object' });
    }

    const errors = {};
    const profile = {};
    const address = {};
    let reason;

    if (body.profile !== undefined) {
      if (!isPlainObject(body.profile)) {
        errors.profile = 'profile must be an object';
      } else {
        for (const key of LOCKED_PROFILE_KEYS) {
          if (body.profile[key] !== undefined) {
            errors[`profile.${key}`] = `profile.${key} cannot be modified`;
          }
        }

        if (body.profile.email !== undefined) {
          try {
            // Stored in lowercase, same as the registration
            profile.email = EmailValidator.validateEmail(
              body.profile.email
            ).toLowerCase();
          } catch (error) {
            errors['profile.email'] = error.message;
          }
        }

        if (body.profile.phone !== undefined) {
          try {
            profile.phone = PhoneValidator.validatePhone(body.profile.phone);
          } catch (error) {
            errors['profile.phone'] = error.message;
          }
        }
      }
    }

    if (body.address !== undefined) {
      if (!isPlainObject(body.address)) {
        errors.address = 'address must be an object';
      } else {
        for (const key of ADDRESS_KEYS) {
          const value = body.address[key];
          if (value === undefined) {
            continue;
          }

          // address_line_2 is optional and can be cleared with null
          if (key === 'address_line_2') {
            if (value === null) {
              address[key] = null;
            } else if (typeof value !== 'string') {
              errors['address.address_line_2'] =
                'address.address_line_2 must be a string or null';
            } else {
              address[key] = value.trim();
            }
            continue;
          }

          try {
            address[key] = RequiredStringValidator.validateRequiredString(
              value,
              `address.${key}`
            );
          } catch (error) {
            errors[`address.${key}`] = error.message;
          }
        }
      }
    }

    try {
      const validReason = RequiredStringValidator.validateRequiredString(
        body.reason,
        'reason'
      );

      if (validReason.length > MAX_REASON_LENGTH) {
        errors.reason = `reason must be at most ${MAX_REASON_LENGTH} characters`;
      } else {
        reason = validReason;
      }
    } catch (error) {
      errors.reason = error.message;
    }

    // The admin has to confirm the external user agreed to the change
    if (body.consentConfirmed !== true) {
      errors.consentConfirmed = 'consentConfirmed must be true';
    }

    if (
      Object.keys(errors).length === 0 &&
      Object.keys(profile).length === 0 &&
      Object.keys(address).length === 0
    ) {
      errors.body = 'At least one profile or address field is required';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return { profile, address, reason };
  }
}

export default UpdateExternalProfileValidator;
