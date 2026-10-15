import CaseModel from '../../Data/Models/case.model.js';
import UserIdValidator from '../../Data/Validators/userId.validator.js';
import GetCollaboratorByIdUseCase from './getCollaboratorById.usecase.js';

// G-10: Lists the cases assigned to a collaborator
class ListCollaboratorCasesUseCase {
  constructor() {
    this.getCollaboratorById = new GetCollaboratorByIdUseCase();
  }

  async execute(userId) {
    const validUserId = UserIdValidator.validateUserId(userId);

    // Throws 404 if the id is not a collaborator
    await this.getCollaboratorById.execute(validUserId);

    return CaseModel.findAllByAssignedUser(validUserId);
  }
}

export default ListCollaboratorCasesUseCase;
