import CheckPreSubmissionDataUseCase from '../../Domain/UseCases/checkPreSubmissionData.usecase.js';
import EditPreSubmissionDataUseCase from '../../Domain/UseCases/editPreSubmissionData.usecase.js';
import CreateAccountUseCase from '../../Domain/UseCases/createAccount.usecase.js';
import PreSubmissionDTO from '../DTOs/preSubmission.dto.js';
import CreateAccountDTO from '../DTOs/createAccount.dto.js';

const checkPreSubmissionDataUseCase = new CheckPreSubmissionDataUseCase();
const editPreSubmissionDataUseCase = new EditPreSubmissionDataUseCase();
const createAccountUseCase = new CreateAccountUseCase();

class ExternalUserController {
  async createAccount(req, res) {
    try {
      const created = await createAccountUseCase.execute(req.body);
      const payload = new CreateAccountDTO(created).toJSON();

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      return res.status(error.statusCode ?? 400).json({
        success: false,
        error: error.message,
      });
    }
  }

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

export default new ExternalUserController();
