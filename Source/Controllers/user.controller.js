import CheckPreSubmissionDataUseCase from '../../Domain/UseCases/checkPreSubmissionData.usecase.js';
import EditPreSubmissionDataUseCase from '../../Domain/UseCases/editPreSubmissionData.usecase.js';

// Instantiate use case
const checkPreSubmissionDataUseCase = new CheckPreSubmissionDataUseCase();
const editPreSubmissionDataUseCase = new EditPreSubmissionDataUseCase();

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

  async editPreSubmissionData(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const updatedData = await editPreSubmissionDataUseCase(
        userId,
        updateData
      );

      return res.status(200).json({
        sucess: true,
        data: updatedData,
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
