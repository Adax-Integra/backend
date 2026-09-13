import CheckPreSubmissionDataUseCase from '../../Domain/UseCases/checkPreSubmissionData.usecase.js';
import EditPreSubmissionDataUseCase from '../../Domain/UseCases/editPreSubmissionData.usecase.js';
import PreSubmissionDTO from '../DTOs/preSubmission.dto.js';

const checkPreSubmissionDataUseCase = new CheckPreSubmissionDataUseCase();
const editPreSubmissionDataUseCase = new EditPreSubmissionDataUseCase();

class UserController {
  async getPreSubmissionData(req, res) {
    try {
      const { userId } = req.params;
      const data = await checkPreSubmissionDataUseCase.execute(userId);
      const payload = new PreSubmissionDTO(data).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
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
      const updatedData = await editPreSubmissionDataUseCase.execute(
        userId,
        req.body
      );

      return res.status(200).json({
        success: true,
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
