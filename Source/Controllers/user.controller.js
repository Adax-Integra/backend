import CheckPreSubmissionDataUseCase from '../../Domain/UseCases/checkPreSubmissionData.usecase.js';

const checkPreSubmissionDataUseCase = new CheckPreSubmissionDataUseCase();

class UserController {
  async getPreSubmissionData(req, res) {
    try {
      const { userId } = req.params;

      const profileData = await checkPreSubmissionDataUseCase.execute(userId);

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

export default new UserController();
