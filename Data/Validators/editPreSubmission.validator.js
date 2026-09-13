const ALLOWED_KEYS = ['name', 'last_name', 'email', 'birth_date', 'phone'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validationError(message) {
  return new Error(message);
}

// Validates inputs for EditPreSubmissionDataUseCase
class EditPreSubmissionValidator {
  static validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw validationError('userId is required.');
    }
    if (!UUID_PATTERN.test(userId)) {
      throw validationError('userId must be a valid UUID.');
    }
    return userId;
  }

  // Whitelists and validates the profile update body
  static validateUpdateBody(updateData = {}) {
    if (
      updateData === null ||
      typeof updateData !== 'object' ||
      Array.isArray(updateData)
    ) {
      throw validationError('Request body must be an object.');
    }

    const payload = {};
    const errors = [];

    for (const key of ALLOWED_KEYS) {
      if (updateData[key] === undefined) {
        continue;
      }

      const value = updateData[key];

      if (key === 'name' || key === 'last_name') {
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push(`${key} must be a non-empty string.`);
        } else {
          payload[key] = value.trim();
        }
        continue;
      }

      if (key === 'email') {
        if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim())) {
          errors.push('email must be a valid email address.');
        } else {
          payload.email = value.trim().toLowerCase();
        }
        continue;
      }

      if (key === 'birth_date') {
        if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
          errors.push('birth_date must be in YYYY-MM-DD format.');
        } else {
          const parsed = new Date(`${value}T00:00:00.000Z`);
          if (Number.isNaN(parsed.getTime())) {
            errors.push('birth_date must be a valid date.');
          } else {
            payload.birth_date = value;
          }
        }
        continue;
      }

      if (key === 'phone') {
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push('phone must be a non-empty string.');
        } else {
          payload.phone = value.trim();
        }
      }
    }

    if (errors.length > 0) {
      throw validationError(errors.join(' '));
    }

    if (Object.keys(payload).length === 0) {
      throw validationError(
        'At least one of name, last_name, email, birth_date, phone is required.'
      );
    }

    return payload;
  }
}

export default EditPreSubmissionValidator;
