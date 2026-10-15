import ProfileUseCase from '../../Domain/UseCases/profile.usecase.js';
import UpdateProfileUseCase from '../../Domain/UseCases/updateProfile.usecase.js';
import DeactivateAccountUseCase from '../../Domain/UseCases/deactivateAccount.usecase.js';
import ProfileDTO from '../DTOs/profile.dto.js';

const profileUseCase = new ProfileUseCase();
const updateProfileUseCase = new UpdateProfileUseCase();
const deactivateAccountUseCase = new DeactivateAccountUseCase();

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

  // The user deactivates her own account, userId always comes from the session (g-08)
  async deactivateAccount(req, res) {
    try {
      const data = await deactivateAccountUseCase.execute(
        req.user.user_id,
        req.user.roles
      );

      // The app closes the session after this response
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(error.status ?? 500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new ProfileController();
