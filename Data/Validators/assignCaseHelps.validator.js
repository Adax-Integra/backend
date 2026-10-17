/*R-08: The internal user reads the help the external user wrote and picks
the help types of the catalog. The app sends the final list of selected helps,
an empty list removes every help of the case
*/

import ValidIdValidator from './validId.validator.js';

//The catalog has 9 help types, the cap only stops oversized payloads

const MAX_HELP_IDS = 20;

//Builds an Error carrying the per-field reasons, same shape as createCase

function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.code = 'VALIDATION_ERROR';
  error.details = errors;
  return error;
}

class AssignCaseHelpsValidator {
  static validateAssignBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError({ body: 'Request body must be an object' });
    }

    const { helpIds } = body;

    if (!Array.isArray(helpIds)) {
      throw validationError({ helpIds: 'helpIds must be an array' });
    }

    if (helpIds.length > MAX_HELP_IDS) {
      throw validationError({
        helpIds: `helpIds must have at most ${MAX_HELP_IDS} items`,
      });
    }

    const validHelpIds = [];

    for (const helpId of helpIds) {
      try {
        //UUIDs are compared in lowercase so the same id is not counted twice

        validHelpIds.push(
          ValidIdValidator.validateId(helpId, 'helpIds').toLowerCase()
        );
      } catch {
        throw validationError({
          helpIds: 'helpIds must only contain valid UUIDs',
        });
      }
    }

    if (new Set(validHelpIds).size !== validHelpIds.length) {
      throw validationError({ helpIds: 'helpIds must not contain duplicates' });
    }

    return { helpIds: validHelpIds };
  }
}

export default AssignCaseHelpsValidator;
