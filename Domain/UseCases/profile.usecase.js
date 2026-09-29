import ProfileModel from '../../data/models/profile.model.js';

//handles profile retrieval operation from controller (g-13)
class ProfileUseCase {
  async execute(userId) {
    return await ProfileModel.findByUserId(userId);
  }
}

export default ProfileUseCase;
