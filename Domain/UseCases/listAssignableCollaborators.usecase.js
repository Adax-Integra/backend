import InternalUserModel from '../../Data/Models/internalUser.model.js';

// R-10: Retrieves the active internal and admin accounts that can be assigned to a case
class ListAssignableCollaboratorsUseCase {
  async execute() {
    return await InternalUserModel.findAssignable();
  }
}

export default ListAssignableCollaboratorsUseCase;
