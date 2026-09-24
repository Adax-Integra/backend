const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

class PrivacyConsentValidator {
  static validateBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError('Request body must be an object.');
    }

    const errors = [];
    const consent = {};

    for (const key of ['userId', 'policyId']) {
      const value = body[key];
      if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
        errors.push(`${key} is required and must be a valid UUID.`);
      } else {
        consent[key] = value.trim();
      }
    }

    if (errors.length > 0) {
      throw validationError(errors.join(' '));
    }
    return consent;
  }
}

export default PrivacyConsentValidator;
