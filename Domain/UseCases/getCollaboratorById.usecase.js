import InternalUserModel from '../../Data/Models/internalUser.model.js';
import UserIdValidator from '../../Data/Validators/userId.validator.js';

// G-10 we get the detail of a collaborator account by its user id
class GetCollaboratorByIdUseCase {
  // Looks up an internal account by its user id
  // and  returns a "not found" error when the user does not exist or is not an internal account
  async execute(userId) {
    const validUserId = UserIdValidator.validateUserId(userId);

    // Asks the model for the account with its role and office
    const collaborator = await InternalUserModel.findById(validUserId);

    // The model returns null when there is no internal account with that id
    if (!collaborator) {
      const error = new Error('Collaborator not found');
      error.status = 404;
      throw error;
    }

    return collaborator;
  }
}

export default GetCollaboratorByIdUseCase;
