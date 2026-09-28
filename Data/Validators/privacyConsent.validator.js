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

    const policyId = body.policyId;
    if (typeof policyId !== 'string' || !UUID_PATTERN.test(policyId.trim())) {
      throw validationError('policyId is required and must be a valid UUID.');
    }

    return { policyId: policyId.trim() };
  }

  static validateUserId(userId) {
    if (typeof userId !== 'string' || !UUID_PATTERN.test(userId.trim())) {
      throw validationError('userId is required and must be a valid UUID.');
    }
    return userId.trim();
  }
}

export default PrivacyConsentValidator;
