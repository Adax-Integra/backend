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
import GetCollaboratorByIdUseCase from '../../Domain/UseCases/getCollaboratorById.usecase.js';
import CollaboratorDetailDTO from '../DTOs/collaboratorDetail.dto.js';
import ListCollaboratorCasesUseCase from '../../Domain/UseCases/listCollaboratorCases.usecase.js';
import CollaboratorCasesDTO from '../DTOs/collaboratorCases.dto.js';
import LogActivityUseCase from '../../Domain/UseCases/logActivity.usecase.js';
import CreateCaseUseCase from '../../Domain/UseCases/createCase.usecase.js';
import CreateCaseDTO from '../DTOs/createCase.dto.js';
import UpdateCollaboratorStatusUseCase from '../../Domain/UseCases/updateCollaboratorStatus.usecase.js';
import CollaboratorStatusDTO from '../DTOs/collaboratorStatus.dto.js';
import ListExternalUsersUseCase from '../../Domain/UseCases/listExternalUsers.usecase.js';
import ExternalUserListDTO from '../DTOs/externalUserList.dto.js';
import UpdateCollaboratorProfileUseCase from '../../Domain/UseCases/updateCollaboratorProfile.usecase.js';
import GetExternalUserDocumentsUseCase from '../../Domain/UseCases/getExternalUserDocuments.usecase.js';
import ExternalUserDocumentsDTO from '../DTOs/externalUserDocuments.dto.js';
import ReviewVerificationUseCase from '../../Domain/UseCases/reviewVerification.usecase.js';
import publicBaseUrl from '../../Data/Services/publicBaseUrl.helper.js';

const listCollaboratorsUseCase = new ListCollaboratorsUseCase();
const getAllCasesFromUser = new GetAllCasesFromUser();
const registerExternalUserUseCase = new RegisterExternalUserUseCase();
const getExternalProfileUseCase = new GetExternalProfileUseCase();
const updateExternalProfileUseCase = new UpdateExternalProfileUseCase();
const createCollaboratorUseCase = new CreateCollaboratorUseCase();
const listActivityLogUseCase = new ListActivityLogUseCase();
const getCollaboratorByIdUseCase = new GetCollaboratorByIdUseCase();
const listCollaboratorCasesUseCase = new ListCollaboratorCasesUseCase();
const logActivityUseCase = new LogActivityUseCase();
const createCaseUseCase = new CreateCaseUseCase();
const updateCollaboratorStatusUseCase = new UpdateCollaboratorStatusUseCase();
const listExternalUsersUseCase = new ListExternalUsersUseCase();
const updateCollaboratorProfileUseCase = new UpdateCollaboratorProfileUseCase();
const getExternalUserDocumentsUseCase = new GetExternalUserDocumentsUseCase();
const reviewVerificationUseCase = new ReviewVerificationUseCase();

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

      // V-06: the collaborator who registered the record appears in the activity log
      await logActivityUseCase.execute({
        actorId: req.user.user_id,
        action: 'register_external_user',
        entity: 'user',
        entityId: payload.user_id,
      });

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

  // R-11: An internal user registers a case for an external user
  createCaseForExternalUser = async (req, res) => {
    try {
      const created = await createCaseUseCase.execute(
        req.params.userId,
        req.body
      );
      const payload = new CreateCaseDTO(created).toJSON();

      // V-06: the internal user who created the case appears in the activity log
      await logActivityUseCase.execute({
        actorId: req.user.user_id,
        action: 'internal_create_case',
        entity: 'case',
        entityId: payload.caseId,
      });

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to create case for external user: ', error);

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

  // B-02: Admin or internal staff approves or rejects an external user's verification
  reviewExternalVerification = async (req, res) => {
    try {
      const updated = await reviewVerificationUseCase.execute(
        req.user.user_id,
        req.params.userId,
        req.body
      );

      return res.status(200).json({
        success: true,
        data: {
          user_id: updated.user_id,
          verification_status: updated.verification_status,
        },
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to review verification: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to review the verification',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  //V-13: An internal user views the documents of an external user's record
  getExternalUserDocuments = async (req, res) => {
    try {
      const documents = await getExternalUserDocumentsUseCase.execute(
        req.params.userId,
        publicBaseUrl(req)
      );
      const payload = new ExternalUserDocumentsDTO(documents).toJSON();

      //V-06 identity documents are sensitive, every consultation is logged
      await logActivityUseCase.execute({
        actorId: req.user.user_id,
        action: 'view_external_documents',
        entity: 'user',
        entityId: payload.user_id,
      });

      //The response carries signed links, it must not be cached
      res.set('Cache-Control', 'no-store');

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to get external user documents: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the documents',
        });
      }

      return res.status(status).json({
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

      // V-06: the admin who created the account appears in the activity log
      await logActivityUseCase.execute({
        actorId: req.user.user_id,
        action: 'create_collaborator',
        entity: 'user',
        entityId: payload.user_id,
      });

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

  // G-06: Admin gets the list of internal accounts
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

  // New method for US G-10 where the Admin gets the detail of a specific intenral user
  getCollaboratorDetail = async (req, res) => {
    try {
      // The use case validates the id and throws 400 or 404 when needed
      const collaborator = await getCollaboratorByIdUseCase.execute(
        req.params.userId
      );

      const payload = new CollaboratorDetailDTO(collaborator).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to get collaborator detail: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the collaborator detail',
        });
      }
      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  // G-10: Admin gets the cases assigned to one collaborator
  getCollaboratorCases = async (req, res) => {
    try {
      // The use case validates the id and throws 400 or 404
      const result = await listCollaboratorCasesUseCase.execute(
        req.params.userId
      );

      const payload = new CollaboratorCasesDTO(result).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to get collaborator cases: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the collaborator cases',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  // G-04: Admin activates or deactivates a collaborator account
  updateCollaboratorStatus = async (req, res) => {
    try {
      const userId = req.params.userId;
      const isActive = req.body.is_active;

      // Changes the status of the account
      const updatedCollaborator = await updateCollaboratorStatusUseCase.execute(
        userId,
        isActive
      );

      // Prepares the data for the app
      const payload = new CollaboratorStatusDTO(updatedCollaborator).toJSON();

      // V-06: saves the change in the activity log
      await logActivityUseCase.execute({
        actorId: req.user.user_id,
        action: 'update_collaborator_status',
        entity: 'user',
        entityId: payload.user_id,
      });

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      let status = 500;
      if (error.status) {
        status = error.status;
      }

      // Server error
      if (status === 500) {
        console.error('Failed to update collaborator status: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to update the collaborator status',
        });
      }

      // Client error (400, 404 or 409)
      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  updateCollaboratorProfile = async (req, res) => {
    try {
      const updated = await updateCollaboratorProfileUseCase.execute(
        req.user.user_id,
        req.params.userId,
        req.body
      );

      return res.status(200).json({
        success: true,
        data: {
          user_id: updated.user_id,
          name: updated.name,
          last_name: updated.last_name,
          email: updated.email,
        },
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to update collaborator profile: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to update the collaborator profile',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  };

  // G-16: Admin gets the list of external accounts
  listExternalUsers = async (req, res) => {
    try {
      const result = await listExternalUsersUseCase.execute(req.query);
      const payload = new ExternalUserListDTO(result).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to list external users: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to retrieve external users',
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
