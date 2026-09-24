const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validationError(message) {
  return new Error(message);
}

class CaseIdValidator {
  static validateCaseId(caseId) {
    if (!caseId || typeof caseId !== 'string') {
      throw validationError('caseId is required.');
    }

    if (!UUID_PATTERN.test(caseId)) {
      throw validationError('caseId must be a valid UUID.');
    }

    return caseId;
  }
}

export default CaseIdValidator;
