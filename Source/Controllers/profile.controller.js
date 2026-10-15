import ProfileUseCase from '../../Domain/UseCases/profile.usecase.js';
import UpdateProfileUseCase from '../../Domain/UseCases/updateProfile.usecase.js';
import ProfileDTO from '../DTOs/profile.dto.js';

const profileUseCase = new ProfileUseCase();
const updateProfileUseCase = new UpdateProfileUseCase();

class ProfileController {
  //simply obtain data for the profile view depending on the userId obtained from the session (g-13)
  async getProfileByUserId(req, res) {
    const userId = req.user.user_id;

    try {
      const profileData = await profileUseCase.execute(userId, req.user.roles);
      return res.status(200).json({
        success: true,
        data: new ProfileDTO(profileData).toJSON(),
      });
    } catch (error) {
      return res.status(error.status ?? 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // The user edits their own info, userId always comes from the session (r-04)
  async updateProfile(req, res) {
    try {
      await updateProfileUseCase.execute(
        req.user.user_id,
        req.user.roles,
        req.body
      );

      // The app reloads the profile with GET /profile/:userId
      return res.status(200).json({
        success: true,
        data: { message: 'Profile updated successfully.' },
      });
    } catch (error) {
      return res.status(error.status ?? 400).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  }
}

export default new ProfileController();
