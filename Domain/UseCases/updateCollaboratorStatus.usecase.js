import InternalUserModel from '../../Data/Models/internalUser.model.js';
import UserIdValidator from '../../Data/Validators/userId.validator.js';
import AccountStatusValidator from '../../Data/Validators/accountStatus.validator.js';

// G-04: Admin activates or deactivates a collaborator account
class UpdateCollaboratorStatusUseCase {
  async execute(userId, isActive) {
    // Validate that the user ID is valid
    const validUserId = UserIdValidator.validateUserId(userId);

    // Validate that the status is true or false
    const validIsActive = AccountStatusValidator.validateIsActive(isActive);

    // Search for the collaborator in the database
    const collaborator = await InternalUserModel.findById(validUserId);

    // If the collaborator does not exist, throw a 404 error
    if (!collaborator) {
      const error = new Error('Collaborator not found');
      error.status = 404;
      throw error;
    }

    // Checks if the account is currently active
    let isActiveNow = false;
    if (collaborator.deleted_at === null) {
      isActiveNow = true;
    }

    // If the account already has the same status, throw a 409 error
    if (isActiveNow === validIsActive) {
      const error = new Error('The account already has that status');
      error.status = 409;
      throw error;
    }

    // Save the new status
    const updatedCollaborator = await InternalUserModel.updateStatus(
      validUserId,
      validIsActive
    );

    // Returns the updated collaborator
    return updatedCollaborator;
  }
}

export default UpdateCollaboratorStatusUseCase;
