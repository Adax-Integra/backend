import GetAllCasesFromUser from '../../Domain/UseCases/getAllCasesFromUser.usecase.js';
import getAllCasesDTO from '../DTOs/getAllCases.dto.js';
import RegisterExternalUserUseCase from '../../Domain/UseCases/registerExternalUser.usecase.js';
import RegisterExternalUserDTO from '../DTOs/registerExternalUser.dto.js';
import CreateCollaboratorUseCase from '../../Domain/UseCases/createCollaborator.usecase.js';
import CreateCollaboratorDTO from '../DTOs/createCollaborator.dto.js';

const getAllCasesFromUser = new GetAllCasesFromUser();
const registerExternalUserUseCase = new RegisterExternalUserUseCase();
const createCollaboratorUseCase = new CreateCollaboratorUseCase();

class InternalUserController {
  getAllCasesFromUser = async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId parameter is required',
        });
      }

      const response = await getAllCasesFromUser.execute(userId);
      const rows = Array.isArray(response) ? response : response?.cases;

      if (!Array.isArray(rows)) {
        throw new Error('The cases use case must return an array of cases.');
      }

      const payload = getAllCasesDTO.fromRows(rows);

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
  };

  registerExternalUser = async (req, res) => {
    try {
      const created = await registerExternalUserUseCase.execute(req.body);
      const payload = new RegisterExternalUserDTO(created).toJSON();

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  // G-03: The admin creates a new collaborator account
  createCollaborator = async (req, res) => {
    try {
      const created = await createCollaboratorUseCase.execute(req.body);
      const payload = new CreateCollaboratorDTO(created).toJSON();

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to create collaborator: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to create the collaborator',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  };
}

export default new InternalUserController();
