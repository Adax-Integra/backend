import GetAllCasesFromUser from '../../Domain/UseCases/getAllCasesFromUser.usecase.js';
import getAllCasesDTO from '../DTOs/getAllCases.dto.js';
import RegisterExternalUserUseCase from '../../Domain/UseCases/registerExternalUser.usecase.js';
import RegisterExternalUserDTO from '../DTOs/registerExternalUser.dto.js';
import GetExternalProfileUseCase from '../../Domain/UseCases/getExternalProfile.usecase.js';
import UpdateExternalProfileUseCase from '../../Domain/UseCases/updateExternalProfile.usecase.js';
import ExternalProfileDTO from '../DTOs/externalProfile.dto.js';
import CreateCollaboratorUseCase from '../../Domain/UseCases/createCollaborator.usecase.js';
import CreateCollaboratorDTO from '../DTOs/createCollaborator.dto.js';
import ListActivityLogUseCase from '../../Domain/UseCases/listActivityLog.usecase.js';
import ActivityLogDTO from '../DTOs/activityLog.dto.js';
import ListCollaboratorsUseCase from '../../Domain/UseCases/listCollaborators.usecase.js';
import CollaboratorListDTO from '../DTOs/collaboratorList.dto.js';

const listCollaboratorsUseCase = new ListCollaboratorsUseCase();
const getAllCasesFromUser = new GetAllCasesFromUser();
const registerExternalUserUseCase = new RegisterExternalUserUseCase();
const getExternalProfileUseCase = new GetExternalProfileUseCase();
const updateExternalProfileUseCase = new UpdateExternalProfileUseCase();
const createCollaboratorUseCase = new CreateCollaboratorUseCase();
const listActivityLogUseCase = new ListActivityLogUseCase();

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

  // G-07 Shows the data of an external user before the admin edits it
  getExternalProfile = async (req, res) => {
    try {
      const data = await getExternalProfileUseCase.execute(req.params.userId);
      const payload = new ExternalProfileDTO(data).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to get external profile: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the external profile',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  // G-07: Updates the text data of an external user
  updateExternalProfile = async (req, res) => {
    try {
      const updated = await updateExternalProfileUseCase.execute(
        req.user.user_id,
        req.params.userId,
        req.body
      );
      const payload = new ExternalProfileDTO(updated).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to update external profile: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to update the external profile',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
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

  // V-06: The admin consults the activity log of the system
  listActivityLog = async (req, res) => {
    try {
      const result = await listActivityLogUseCase.execute(req.query);
      const payload = new ActivityLogDTO(result).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to list activity log: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the activity log',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  };

  // // G-06: Admin gets the list of internal accounts
  listCollaborators = async (req, res) => {
    try {
      // Gets all collaborators
      const collaborators = await listCollaboratorsUseCase.execute();

      // Prepares the data for the app
      const payload = collaborators.map((user) =>
        new CollaboratorListDTO(user).toJSON()
      );
      // Returns the collaborators list
      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      // Logs the error if something fails
      console.error('Failed to list collaborators: ', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to list collaborators',
      });
    }
  };
}

export default new InternalUserController();
