import CaseHelpModel from '../../Data/Models/caseHelp.model.js';
import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import AssignCaseHelpsValidator from '../../Data/Validators/assignCaseHelps.validator.js';

//Error with the HTTP status and code the controller sends to the app

function caseHelpError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// R-08: the internal user assigns the required helps to a case

class AssignCaseHelpsUseCase {
  async execute(caseId, body) {
    let validCaseId;
    try {
      validCaseId = ValidIdValidator.validateId(caseId, 'caseId');
    } catch (error) {
      throw caseHelpError(error.message, 400, 'VALIDATION_ERROR');
    }

    const { helpIds } = AssignCaseHelpsValidator.validateAssignBody(body);

    const caseData = await CaseHelpModel.findCaseById(validCaseId);
    if (!caseData) {
      throw caseHelpError(
        `Case with ID ${validCaseId} not found.`,
        404,
        'CASE_NOT_FOUND'
      );
    }

    // Same rule as V-11: a closed case cannot be changed

    if (caseData.state === 'Closed') {
      throw caseHelpError(
        `Case with ID ${validCaseId} is closed.`,
        409,
        'CASE_CLOSED'
      );
    }

    // Every id must be an active help type of the catalog

    const foundHelpTypes = await CaseHelpModel.findHelpTypesByIds(helpIds);
    if (foundHelpTypes.length !== helpIds.length) {
      throw caseHelpError(
        'helpIds contains help types that do not exist.',
        400,
        'INVALID_HELP_TYPE'
      );
    }

    await CaseHelpModel.replaceForCase(validCaseId, helpIds);
    const helps = await CaseHelpModel.findActiveByCaseId(validCaseId);

    return { caseId: validCaseId, helps };
  }
}

export default AssignCaseHelpsUseCase;
