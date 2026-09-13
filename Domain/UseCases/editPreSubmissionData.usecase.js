import UserModel from '../../Data/Models/user.model.js';

class EditPreSubmissionDataUseCase {
  async execute(userId, updateData) {
    if (!userId) {
      throw new Error('userId is required.');
    }

    return UserModel.updateProfile(userId, updateData);
  }
}

export default EditPreSubmissionDataUseCase;
