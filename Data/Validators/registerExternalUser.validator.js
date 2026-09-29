const REQUIRED_ADDRESS_KEYS = [
  'address_line_1',
  'neighborhood',
  'zip_code',
  'country',
  'state',
  'city',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validationError(message) {
  return new Error(message);
}

class RegisterExternalUserValidator {
  static validateBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError('Request body must be an object.');
    }

    const errors = [];
    const profile = {};
    const address = {};

    const prof = body.profile;
    if (prof === null || typeof prof !== 'object' || Array.isArray(prof)) {
      errors.push('profile is required and must be an object.');
    } else {
      for (const key of ['name', 'last_name']) {
        const value = prof[key];
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push(
            `profile.${key} is required and must be a non-empty string.`
          );
        } else {
          profile[key] = value.trim();
        }
      }
      if (
        typeof prof.email !== 'string' ||
        !EMAIL_PATTERN.test(prof.email.trim())
      ) {
        errors.push(
          'profile.email is required and must be a valid email address.'
        );
      } else {
        profile.email = prof.email.trim().toLowerCase();
      }

      if (prof.birth_date !== undefined) {
        if (
          typeof prof.birth_date !== 'string' ||
          !DATE_PATTERN.test(prof.birth_date)
        ) {
          errors.push('profile.birth_date must be in YYYY-MM-DD format.');
        } else {
          const parsed = new Date(`${prof.birth_date}T00:00:00.000Z`);
          if (Number.isNaN(parsed.getTime())) {
            errors.push('profile.birth_date must be a valid date.');
          } else {
            profile.birth_date = prof.birth_date;
          }
        }
      }

      if (prof.phone !== undefined) {
        if (typeof prof.phone !== 'string' || prof.phone.trim() === '') {
          errors.push('profile.phone must be a non-empty string.');
        } else {
          profile.phone = prof.phone.trim();
        }
      }
    }
    const addr = body.address;
    if (addr === null || typeof addr !== 'object' || Array.isArray(addr)) {
      errors.push('address is required and must be an object.');
    } else {
      for (const key of REQUIRED_ADDRESS_KEYS) {
        const value = addr[key];
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push(
            `address.${key} is required and must be a non-empty string.`
          );
        } else {
          address[key] = value.trim();
        }
      }

      if (addr.address_line_2 !== undefined && addr.address_line_2 !== null) {
        if (typeof addr.address_line_2 !== 'string') {
          errors.push('address.address_line_2 must be a string.');
        } else {
          address.address_line_2 = addr.address_line_2.trim();
        }
      }
    }

    if (errors.length > 0) {
      throw validationError(errors.join(' '));
    }
    return { profile, address };
  }
}

export default RegisterExternalUserValidator;
