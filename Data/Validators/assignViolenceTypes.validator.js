import ValidIdValidator from './validId.validator.js';

//The catalog has 8 violence types

const MAX_VIOLENCE_IDS = 20;

//Builds an Error carrying the per-field reasons, same shape as assignCaseHelps

function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.code = 'VALIDATION_ERROR';
  error.details = errors;
  return error;
}

class AssignViolenceTypesValidator {
  static validateCaseId(caseId) {
    try {
      return ValidIdValidator.validateId(caseId, 'caseId');
    } catch {
      throw validationError({ caseId: 'caseId must be a valid UUID.' });
    }
  }

  static validateViolenceIds(violenceIds) {
    if (!Array.isArray(violenceIds)) {
      throw validationError({ violenceIds: 'violenceIds must be an array.' });
    }

    if (violenceIds.length > MAX_VIOLENCE_IDS) {
      throw validationError({
        violenceIds: `violenceIds must have at most ${MAX_VIOLENCE_IDS} items.`,
      });
    }

    const validViolenceIds = [];

    for (const violenceId of violenceIds) {
      try {
        //UUIDs are compared in lowercase so the same id is not counted twice

        validViolenceIds.push(
          ValidIdValidator.validateId(violenceId, 'violenceIds').toLowerCase()
        );
      } catch {
        throw validationError({
          violenceIds: 'violenceIds must only contain valid UUIDs.',
        });
      }
    }

    if (new Set(validViolenceIds).size !== validViolenceIds.length) {
      throw validationError({
        violenceIds: 'Duplicate violence types are not allowed.',
      });
    }

    return validViolenceIds;
  }
}

export default AssignViolenceTypesValidator;
