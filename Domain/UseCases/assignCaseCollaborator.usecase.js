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

/*
userIds must be a non-empty array of UUIDs.
Repeated ids would make the upsert fail, so each one is kept once
*/
function validateUserIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('userIds must be a non-empty array.');
  }

  const ids = userIds.map((userId, index) =>
    ValidIdValidator.validateId(userId, `userIds[${index}]`).toLowerCase()
  );
  return [...new Set(ids)];
}

// R-10: the admin or internal user assigns one or more internal or admin users to a case
class AssignCaseCollaboratorUseCase {
  async execute(caseId, body) {
    let validCaseId;
    let validUserIds;
    try {
      validCaseId = ValidIdValidator.validateId(caseId, 'caseId');
      validUserIds = validateUserIds(body?.userIds);
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

    // Every id is checked before saving, so one bad id rejects the whole request
    const collaborators =
      await InternalUserModel.findAssignableByIds(validUserIds);
    const foundById = new Map(
      collaborators.map((collaborator) => [collaborator.user_id, collaborator])
    );

    // Only internal and admin accounts can be assigned, the model leaves the rest out
    const missingId = validUserIds.find((userId) => !foundById.has(userId));
    if (missingId) {
      throw assignmentError(
        `Collaborator with ID ${missingId} not found.`,
        404,
        'COLLABORATOR_NOT_FOUND'
      );
    }

    // The model also returns deactivated accounts, they cannot take new cases
    const inactiveId = validUserIds.find(
      (userId) => foundById.get(userId).deleted_at
    );
    if (inactiveId) {
      throw assignmentError(
        `Collaborator with ID ${inactiveId} is inactive.`,
        409,
        'COLLABORATOR_INACTIVE'
      );
    }

    await CaseModel.assignUsers(validCaseId, validUserIds);

    // The validated ids are returned so the controller can write the activity log
    return { caseId: validCaseId, userIds: validUserIds };
  }
}

export default AssignCaseCollaboratorUseCase;
