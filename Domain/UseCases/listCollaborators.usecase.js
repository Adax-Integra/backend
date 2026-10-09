import InternalUserModel from '../../Data/Models/internalUser.model.js';

class ListCollaboratorsUseCase {
  // Gets the list of collaborators
  async execute() {
    // Gets all internal accounts from the model
    const collaborators = await InternalUserModel.findAll();

    return collaborators;
    // Returns the list of collaborators
  }
}

export default ListCollaboratorsUseCase;
