import CheckPreSubmissionDataUseCase from '../../Domain/UseCases/checkPreSubmissionData.usecase.js';
import EditPreSubmissionDataUseCase from '../../Domain/UseCases/editPreSubmissionData.usecase.js';
import PreSubmissionDTO from '../DTOs/preSubmission.dto.js';
import CreateCaseUseCase from '../../Domain/UseCases/createCase.usecase.js';
import CreateCaseDTO from '../DTOs/createCase.dto.js';

const checkPreSubmissionDataUseCase = new CheckPreSubmissionDataUseCase();
const editPreSubmissionDataUseCase = new EditPreSubmissionDataUseCase();
const createCaseUseCase = new CreateCaseUseCase();

class ExternalUserController {
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

  //R-02 Registers the details of a case for an external user
  async createCase(req, res) {
    try {
      const { userId } = req.params;
      const created = await createCaseUseCase.execute(userId, req.body);
      const payload = new CreateCaseDTO(created).toJSON();

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to create case: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to create the case',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  }
}

export default new ExternalUserController();
