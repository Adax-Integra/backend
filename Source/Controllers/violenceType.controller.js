import ListViolenceTypesUseCase from '../../Domain/UseCases/listViolenceTypes.usecase.js';
import AssignViolenceTypesUseCase from '../../Domain/UseCases/assignViolenceTypes.usecase.js';
import GetAssignedViolenceTypesUseCase from '../../Domain/UseCases/getAssignedViolenceTypes.usecase.js';

const listViolenceTypesUseCase = new ListViolenceTypesUseCase();
const assignViolenceTypesUseCase = new AssignViolenceTypesUseCase();
const getAssignedViolenceTypesUseCase = new GetAssignedViolenceTypesUseCase();

class ViolenceTypeController {
  async listViolenceTypes(req, res) {
    try {
      const violenceTypes = await listViolenceTypesUseCase.execute();

      return res.status(200).json({
        success: true,
        data: violenceTypes,
      });
    } catch (error) {
      console.error('Failed to list violence types:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve violence types.',
      });
    }
  }

  async getAssignedViolenceTypes(req, res) {
    try {
      const data = await getAssignedViolenceTypesUseCase.execute(
        req.params.caseId
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
      }

      console.error('Failed to retrieve assigned violence types');

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve assigned violence types.',
      });
    }
  }

  async assignViolenceTypes(req, res) {
    try {
      const data = await assignViolenceTypesUseCase.execute(
        req.params.caseId,
        req.body
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
      }

      console.error('Failed to assign violence types:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to assign violence types.',
      });
    }
  }
}

export default new ViolenceTypeController();
