import InternalUserModel from '../../Data/Models/internalUser.model.js';

// G-10 we get the detail of a collaborator account by its user id
class GetCollaboratorByIdUseCase {
  // Looks up an internal account by its user id
  // and  returns a "not found" error when the user does not exist or is not an internal account

  async execute(userId) {
    // we ask the model for the account with its role and office
    const collaborator = await InternalUserModel.findById(userId);

    // if the model returns null is because there is no internal account with that id
    if (!collaborator) {
      const error = new Error('Collaborator not found');
      error.statusCode = 404;
      throw error;
    }

    return collaborator;
  }
}

export default GetCollaboratorByIdUseCase;
