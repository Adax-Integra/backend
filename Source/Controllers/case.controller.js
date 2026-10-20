import GetCaseByIdUseCase from '../../Domain/UseCases/getCaseById.usecase.js';
import ListCasesUseCase from '../../Domain/UseCases/listCases.usecase.js';
import CaseListDTO from '../DTOs/caseList.dto.js';
import CaseDetailDTO from '../DTOs/caseDetail.dto.js';
import GetAllCasesFromUser from '../../Domain/UseCases/getAllCasesFromUser.usecase.js';
import CaseSummaryDTO from '../DTOs/getAllCases.dto.js';
import CloseCaseUseCase from '../../Domain/UseCases/closeCase.usecase.js';
import AssignViolenceTypesUseCase from '../../Domain/UseCases/assignViolenceTypes.usecase.js';
import ListViolenceTypesUseCase from '../../Domain/UseCases/listViolenceTypes.usecase.js';
import LogActivityUseCase from '../../Domain/UseCases/logActivity.usecase.js';
import ListAssignedCasesUseCase from '../../Domain/UseCases/listAssignedCases.usecase.js';
import AssignedCasesQueryValidator from '../../Data/Validators/assignedCasesQuery.validator.js';
import AssignCaseCollaboratorUseCase from '../../Domain/UseCases/assignCaseCollaborator.usecase.js';
import CaseViolenceTypesDTO from '../DTOs/caseViolenceTypes.dto.js';
import ListAssignableCollaboratorsUseCase from '../../Domain/UseCases/listAssignableCollaborators.usecase.js';
import AssignableCollaboratorsDTO from '../DTOs/assignableCollaborators.dto.js';
import ReplaceCaseCollaboratorsUseCase from '../../Domain/UseCases/replaceCaseCollaborators.usecase.js';
import UpdateCaseStepUseCase from '../../Domain/UseCases/updateCaseStep.usecase.js';

const listCasesUseCase = new ListCasesUseCase();
const getCaseByIdUseCase = new GetCaseByIdUseCase();
const getAllCasesFromUser = new GetAllCasesFromUser();
const closeCaseUseCase = new CloseCaseUseCase();
const assignViolenceTypesUseCase = new AssignViolenceTypesUseCase();
const listViolenceTypesUseCase = new ListViolenceTypesUseCase();
const logActivityUseCase = new LogActivityUseCase();
const listAssignedCasesUseCase = new ListAssignedCasesUseCase();
const assignCaseCollaboratorUseCase = new AssignCaseCollaboratorUseCase();
const listAssignableCollaboratorsUseCase =
  new ListAssignableCollaboratorsUseCase();
const replaceCaseCollaboratorsUseCase = new ReplaceCaseCollaboratorsUseCase();
const updateCaseStepUseCase = new UpdateCaseStepUseCase();

class CaseController {
  async listCases(req, res) {
    // Query parameters arrive as strings. Use defaults only when omitted.
    const {
      page: pageQuery = '1',
      limit: limitQuery = '20',
      search = '',
      urgency = '',
    } = req.query;

    if (typeof search !== 'string' || typeof urgency !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'search and urgency must be single text values.',
      });
    }

    const urgencyFilter = urgency.trim();
    if (
      !['', 'Todas', 'Alta', 'Media', 'Baja', 'Sin evaluar'].includes(
        urgencyFilter
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'urgency must be Alta, Media, Baja, Sin evaluar, or Todas.',
      });
    }

    // Reject empty values, repeated parameters, objects, and non-integer text.
    if (
      typeof pageQuery !== 'string' ||
      typeof limitQuery !== 'string' ||
      !/^\d+$/.test(pageQuery) ||
      !/^\d+$/.test(limitQuery)
    ) {
      return res.status(400).json({
        success: false,
        error: 'page and limit must be positive integers.',
      });
    }

    const page = Number(pageQuery);
    const limit = Number(limitQuery);

    // Validate the requested range before calling the use case.
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(page * limit)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid pagination: page or limit is out of range (maximum limit: 100).',
      });
    }

    try {
      const result = await listCasesUseCase.execute({
        page,
        limit,
        search: search.trim(),
        urgency: urgencyFilter,
      });
      const payload = new CaseListDTO(result).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      // Keep database details in server logs instead of exposing them to clients.
      console.error('Failed to list cases:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve cases.',
      });
    }
  }

  // V-12: The collaborator consults her assigned cases (open and closed).
  // The userId comes from the token, never from the URL
  async listAssignedCases(req, res) {
    try {
      const filters = AssignedCasesQueryValidator.validateQuery(req.query);
      const result = await listAssignedCasesUseCase.execute(
        req.user.user_id,
        filters
      );
      // Same response shape as GET /api/cases
      const payload = new CaseListDTO(result).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        // Keep database details in server logs instead of exposing them to clients
        console.error('Failed to list assigned cases:', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to retrieve cases.',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  }

  async getCaseById(req, res) {
    try {
      const { caseId } = req.params;

      const caseData = await getCaseByIdUseCase.execute(caseId);

      return res.status(200).json({
        success: true,
        data: new CaseDetailDTO(caseData).toJSON(),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  //  handles patch request to close a case (V-11) with atomic operation to ensure it only updates if not already closed
  async closeCase(req, res) {
    try {
      const { caseId } = req.params;

      const closedCase = await closeCaseUseCase.execute(caseId);

      // V-06: who closed the case appears in the activity log
      await logActivityUseCase.execute({
        actorId: req.user.user_id,
        action: 'close_case',
        entity: 'case',
        entityId: closedCase.case_id,
      });

      return res.status(200).json({
        success: true,
        data: {
          caseId: closedCase.case_id,
          state: closedCase.state,
          updatedAt: closedCase.updated_at,
        },
      });
    } catch (error) {
      if (
        error.message === 'caseId is required' ||
        error.message === 'caseId must be a valid UUID'
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message && error.message.includes('already closed')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      console.error('Failed to close case:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to close case.',
      });
    }
  }

  // Retrieves active violence types (R-07)
  async listViolenceTypes(_req, res) {
    try {
      const violenceTypes = await listViolenceTypesUseCase.execute();

      return res.status(200).json({
        success: true,
        data: CaseViolenceTypesDTO.fromViolenceTypes(violenceTypes),
      });
    } catch (error) {
      console.error('Failed to list violence types:', error);

      return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Unable to retrieve violence types.',
      });
    }
  }
  // Assigns violence types to a case (R-07)
  async assignViolenceTypes(req, res) {
    try {
      const { violenceIds } = req.body ?? {};

      const result = await assignViolenceTypesUseCase.execute(
        req.params.caseId,
        violenceIds
      );

      return res.status(200).json({
        success: true,
        data: CaseViolenceTypesDTO.fromAssignment(result),
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (error.status >= 500) {
        // Keeps teh data base details insted of exposing them to the client
        console.error('Failed to assign violence types:', error);
        return res.status(error.status).json({
          success: false,
          code: 'SEVER_ERROR',
          error: error.message,
        });
      }

      return res.status(status).json({
        success: false,
        code: error.code ?? 'VALIDATION_ERROR',
        error: error.message,
        errors: error.details ?? null,
      });
    }
  }

  // R-10: lists the active internal and admin accounts that can take a case
  async listAssignableCollaborators(_req, res) {
    try {
      const collaborators = await listAssignableCollaboratorsUseCase.execute();

      return res.status(200).json({
        success: true,
        data: AssignableCollaboratorsDTO.fromRows(collaborators),
      });
    } catch (error) {
      console.error('Failed to list assignable collaborators:', error);

      return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Unable to retrieve collaborators.',
      });
    }
  }

  /*
  R-10: assigns one or more internal or admin users to a case in one call,
  assigning the same user again returns the same assignment
  */
  async assignCollaborator(req, res) {
    try {
      const { caseId, userIds } = await assignCaseCollaboratorUseCase.execute(
        req.params.caseId,
        req.body
      );

      // V-06: who assigned each collaborator appears in the activity log, one entry per collaborator
      await Promise.all(
        userIds.map((userId) =>
          logActivityUseCase.execute({
            actorId: req.user.user_id,
            action: 'assign_case_collaborator',
            entity: 'case',
            entityId: caseId,
            details: { userId },
          })
        )
      );

      // It is only an action, the app already has the ids it sent
      return res.status(200).json({ success: true });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to assign case collaborator:', error);

        return res.status(500).json({
          success: false,
          code: 'SERVER_ERROR',
          error: 'Unable to assign the collaborator.',
        });
      }

      return res.status(status).json({
        success: false,
        code: error.code ?? 'VALIDATION_ERROR',
        error: error.message,
      });
    }
  }

  /*
  R-10: replaces the collaborators of a case with the list sent by the app,
  the ones missing from the list are removed
  */
  async replaceCollaborators(req, res) {
    try {
      const { caseId, userIds, addedIds, removedIds } =
        await replaceCaseCollaboratorsUseCase.execute(
          req.params.caseId,
          req.body
        );

      // V-06: only who was really added or removed appears in the activity log
      const logs = [
        ...addedIds.map((userId) => ({
          action: 'assign_case_collaborator',
          userId,
        })),
        ...removedIds.map((userId) => ({
          action: 'unassign_case_collaborator',
          userId,
        })),
      ];
      await Promise.all(
        logs.map(({ action, userId }) =>
          logActivityUseCase.execute({
            actorId: req.user.user_id,
            action,
            entity: 'case',
            entityId: caseId,
            details: { userId },
          })
        )
      );

      return res.status(200).json({
        success: true,
        data: { caseId, userIds },
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to replace case collaborators:', error);

        return res.status(500).json({
          success: false,
          code: 'SERVER_ERROR',
          error: 'Unable to update the collaborators.',
        });
      }

      return res.status(status).json({
        success: false,
        code: error.code ?? 'VALIDATION_ERROR',
        error: error.message,
      });
    }
  }

  async getCasesByUser(req, res) {
    try {
      const { userId } = req.params;
      const { cases } = await getAllCasesFromUser.execute(userId);

      return res.status(200).json({
        success: true,
        data: CaseSummaryDTO.fromRows(cases),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  //r-13 update case steps
  async updateCaseStep(req, res) {
    try {
      const { caseId } = req.params;
      const { stepNumber } = req.body;

      const updatedCase = await updateCaseStepUseCase.execute(
        caseId,
        stepNumber
      );

      return res.status(200).json({
        success: true,
        data: updatedCase,
      });
    } catch (error) {
      if (
        error.status === 400 ||
        error.message === 'caseId is required' ||
        error.message.includes('required') ||
        error.message.includes('Invalid step number')
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (error.status === 409 || error.message && error.message.includes('closed case')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      console.error('Failed to update case step:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to update case step.',
      });
    }
  }
}

export default new CaseController();
