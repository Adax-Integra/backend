import ProfileUseCase from '../../domain/useCases/profile.usecase.js';

const profileUseCase = new ProfileUseCase();

class ProfileController {
  async getProfileByUserId(req, res) {
    const userId = req.user.id;

    try {
      const profileData = await profileUseCase.execute(userId);
      return res.status(200).json({
        success: true,
        data: profileData,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new ProfileController();
