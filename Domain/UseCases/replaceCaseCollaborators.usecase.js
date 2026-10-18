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
userIds must be an array of UUIDs, an empty array removes every collaborator.
Repeated ids are kept once
*/
function validateUserIds(userIds) {
  if (!Array.isArray(userIds)) {
    throw new Error('userIds must be an array.');
  }

  const ids = userIds.map((userId, index) =>
    ValidIdValidator.validateId(userId, `userIds[${index}]`).toLowerCase()
  );
  return [...new Set(ids)];
}

// R-10: the admin or internal user sends the final list of collaborators of a case.
class ReplaceCaseCollaboratorsUseCase {
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

    const assignedIds = await CaseModel.findAssignedUserIds(validCaseId);
    const addedIds = validUserIds.filter(
      (userId) => !assignedIds.includes(userId)
    );
    const removedIds = assignedIds.filter(
      (userId) => !validUserIds.includes(userId)
    );

    /*
    Only the new users are checked, a collaborator that is already assigned
    and was deactivated later can stay in the list without blocking the request
    */
    if (addedIds.length > 0) {
      const collaborators =
        await InternalUserModel.findAssignableByIds(addedIds);
      const foundById = new Map(
        collaborators.map((collaborator) => [
          collaborator.user_id,
          collaborator,
        ])
      );

      // Only internal and admin accounts can be assigned, the model leaves the rest out
      const missingId = addedIds.find((userId) => !foundById.has(userId));
      if (missingId) {
        throw assignmentError(
          `Collaborator with ID ${missingId} not found.`,
          404,
          'COLLABORATOR_NOT_FOUND'
        );
      }

      // The model also returns deactivated accounts, they cannot take new cases
      const inactiveId = addedIds.find(
        (userId) => foundById.get(userId).deleted_at
      );
      if (inactiveId) {
        throw assignmentError(
          `Collaborator with ID ${inactiveId} is inactive.`,
          409,
          'COLLABORATOR_INACTIVE'
        );
      }

      await CaseModel.assignUsers(validCaseId, addedIds);
    }

    if (removedIds.length > 0) {
      await CaseModel.removeUsers(validCaseId, removedIds);
    }

    // The changes are returned so the controller only logs who was really added or removed
    return {
      caseId: validCaseId,
      userIds: validUserIds,
      addedIds,
      removedIds,
    };
  }
}

export default ReplaceCaseCollaboratorsUseCase;
