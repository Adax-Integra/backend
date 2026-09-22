import EmailValidator from './email.validator.js';
import NameValidator from './name.validator.js';
import DateValidator from './date.validator.js';

const ALLOWED_PROFILE_KEYS = [
  'name',
  'last_name',
  'email',
  'birth_date',
  'phone',
];
const ALLOWED_ADDRESS_KEYS = [
  'address_line_1',
  'address_line_2',
  'neighborhood',
  'zip_code',
  'country',
  'state',
  'city',
];
const ALLOWED_DOCUMENT_KEYS = ['identity_document', 'proof_of_address'];

function validationError(message) {
  return new Error(message);
}

class EditPreSubmissionValidator {
  /**
   * Body shape (matches GET pre-submission response):
   * {
   *   profile?: { name?, last_name?, email?, birth_date?, phone? },
   *   address?: {
   *     address_line_1?, address_line_2?, neighborhood?,
   *     zip_code?, country?, state?, city?
   *   },
   *   documents?: { identity_document?, proof_of_address? }
   * }
   *
   * Document values are paths inside the "user-documents" Storage bucket.
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
    const address = {};
    const documents = {};
    const errors = [];

    if (updateData.profile !== undefined) {
      const prof = updateData.profile;
      if (prof === null || typeof prof !== 'object' || Array.isArray(prof)) {
        errors.push('profile must be an object.');
      } else {
        for (const key of ALLOWED_PROFILE_KEYS) {
          if (prof[key] === undefined) {
            continue;
          }

          const value = prof[key];

          if (key === 'name' || key === 'last_name') {
            profile[key] = NameValidator.validateNameOrLastName(value);
            continue;
          }

          if (key === 'email') {
            profile.email = EmailValidator.validateEmail(value);
            continue;
          }

          if (key === 'birth_date') {
            profile.birth_date = DateValidator.validateDate(value);
            continue;
          }

          if (key === 'phone') {
            if (typeof value !== 'string' || value.trim() === '') {
              errors.push('profile.phone must be a non-empty string.');
            } else {
              profile.phone = value.trim();
            }
          }
        }
      }
    }

    if (updateData.address !== undefined) {
      const addr = updateData.address;
      if (addr === null || typeof addr !== 'object' || Array.isArray(addr)) {
        errors.push('address must be an object.');
      } else {
        for (const key of ALLOWED_ADDRESS_KEYS) {
          if (addr[key] === undefined) {
            continue;
          }

          const value = addr[key];

          // address_line_2 is optional and may be cleared with null/empty
          if (key === 'address_line_2') {
            if (value === null) {
              address[key] = null;
            } else if (typeof value !== 'string') {
              errors.push('address.address_line_2 must be a string or null.');
            } else {
              address[key] = value.trim();
            }
            continue;
          }

          if (typeof value !== 'string' || value.trim() === '') {
            errors.push(`address.${key} must be a non-empty string.`);
            continue;
          }

          address[key] = value.trim();
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
            errors.push(
              `documents.${key} must be a non-empty storage path string.`
            );
            continue;
          }

          const path = value.trim();
          if (userId && !path.startsWith(`${userId}/`)) {
            errors.push(`documents.${key} path must start with "${userId}/".`);
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
      Object.keys(address).length === 0 &&
      Object.keys(documents).length === 0
    ) {
      throw validationError(
        'At least one profile, address, or documents field is required.'
      );
    }

    return { profile, address, documents };
  }
}

export default EditPreSubmissionValidator;
