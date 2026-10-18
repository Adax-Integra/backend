import CaseModel from '../../Data/Models/case.model.js';
import CaseHelpModel from '../../Data/Models/caseHelp.model.js';
import InternalUserModel from '../../Data/Models/internalUser.model.js';
import ValidIdValidator from '../../Data/Validators/validId.validator.js';

function assignmentError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// R-10: the admin or internal user assigns an internal or admin user to a case
class AssignCaseCollaboratorUseCase {
  async execute(caseId, body) {
    let validCaseId;
    let validUserId;
    try {
      validCaseId = ValidIdValidator.validateId(caseId, 'caseId');
      validUserId = ValidIdValidator.validateId(body?.userId, 'userId');
    } catch (error) {
      throw assignmentError(error.message, 400, 'VALIDATION_ERROR');
    }

    const caseData = await CaseHelpModel.findCaseById(validCaseId);
    if (!caseData) {
      throw assignmentError(
        `Case with ID ${validCaseId} not found.`,
        404,
        'CASE_NOT_FOUND'
      );
    }

    // Same rule as V-11: a closed case cannot be changed

    if (caseData.state === 'Closed') {
      throw assignmentError(
        `Case with ID ${validCaseId} is closed.`,
        409,
        'CASE_CLOSED'
      );
    }

    // Only internal and admin accounts can be assigned, the model returns null otherwise
    const collaborator =
      await InternalUserModel.findAssignableById(validUserId);
    if (!collaborator) {
      throw assignmentError(
        `Collaborator with ID ${validUserId} not found.`,
        404,
        'COLLABORATOR_NOT_FOUND'
      );
    }

    // The model also returns deactivated accounts, they cannot take new cases
    if (collaborator.deleted_at) {
      throw assignmentError(
        `Collaborator with ID ${validUserId} is inactive.`,
        409,
        'COLLABORATOR_INACTIVE'
      );
    }

    await CaseModel.assignUser(validCaseId, validUserId);

    // The validated ids are returned so the controller can write the activity log
    return { caseId: validCaseId, userId: validUserId };
  }
}

export default AssignCaseCollaboratorUseCase;
