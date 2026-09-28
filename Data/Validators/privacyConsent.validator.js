import ValidIdValidator from './validId.validator.js';

function requestError(error) {
  error.status = 400;
  return error;
}

class PrivacyConsentValidator {
  static validateBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw requestError(new Error('Request body must be an object.'));
    }

    try {
      return {
        policyId: ValidIdValidator.validateId(body.policyId, 'policyId'),
      };
    } catch (error) {
      throw requestError(error);
    }
  }
}

export default PrivacyConsentValidator;
