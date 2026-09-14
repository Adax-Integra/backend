const ALLOWED_PROFILE_KEYS = [
  'name',
  'last_name',
  'email',
  'birth_date',
  'phone',
];
const ALLOWED_DOCUMENT_KEYS = ['identity_document', 'proof_of_address'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validationError(message) {
  return new Error(message);
}

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

  /**
   * Body shape:
   * {
   *   name?, last_name?, email?, birth_date?, phone?,
   *   documents?: { identity_document?, proof_of_address? }
   * }
   *
   * Document values are paths inside the `user-documents` Storage bucket.
   */
  static validateUpdateBody(updateData = {}, userId) {
    if (
      updateData === null ||
      typeof updateData !== 'object' ||
      Array.isArray(updateData)
    ) {
      throw validationError('Request body must be an object.');
    }

    const profile = {};
    const documents = {};
    const errors = [];

    for (const key of ALLOWED_PROFILE_KEYS) {
      if (updateData[key] === undefined) {
        continue;
      }

      const value = updateData[key];

      if (key === 'name' || key === 'last_name') {
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push(`${key} must be a non-empty string.`);
        } else {
          profile[key] = value.trim();
        }
        continue;
      }

      if (key === 'email') {
        if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim())) {
          errors.push('email must be a valid email address.');
        } else {
          profile.email = value.trim().toLowerCase();
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
            profile.birth_date = value;
          }
        }
        continue;
      }

      if (key === 'phone') {
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push('phone must be a non-empty string.');
        } else {
          profile.phone = value.trim();
        }
      }
    }

    if (updateData.documents !== undefined) {
      const docs = updateData.documents;
      if (docs === null || typeof docs !== 'object' || Array.isArray(docs)) {
        errors.push('documents must be an object.');
      } else {
        for (const key of ALLOWED_DOCUMENT_KEYS) {
          if (docs[key] === undefined) {
            continue;
          }

          const value = docs[key];
          if (typeof value !== 'string' || value.trim() === '') {
            errors.push(`${key} must be a non-empty storage path string.`);
            continue;
          }

          const path = value.trim();
          if (userId && !path.startsWith(`${userId}/`)) {
            errors.push(`${key} path must start with "${userId}/".`);
            continue;
          }

          documents[key] = path;
        }
      }
    }

    if (errors.length > 0) {
      throw validationError(errors.join(' '));
    }

    if (
      Object.keys(profile).length === 0 &&
      Object.keys(documents).length === 0
    ) {
      throw validationError(
        'At least one profile field or documents path is required.'
      );
    }

    return { profile, documents };
  }
}

export default EditPreSubmissionValidator;
