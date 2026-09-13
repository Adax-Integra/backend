import ExternalUserModel from '../../Data/Models/externalUser.model.js';

class EditPreSubmissionDataUseCase {
  async execute(userId, updateData) {
    if (!userId) {
      throw new Error('userId is required.');
    }

    return ExternalUserModel.updateProfile(userId, updateData);
  }
}

export default EditPreSubmissionDataUseCase;
