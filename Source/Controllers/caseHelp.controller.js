import ListHelpTypesUseCase from '../../Domain/UseCases/listHelpTypes.usecase.js';
import AssignCaseHelpsUseCase from '../../Domain/UseCases/assignCaseHelps.usecase.js';
import LogActivityUseCase from '../../Domain/UseCases/logActivity.usecase.js';
import CaseHelpsDTO from '../DTOs/caseHelps.dto.js';

const listHelpTypesUseCase = new ListHelpTypesUseCase();
const assignCaseHelpsUseCase = new AssignCaseHelpsUseCase();
const logActivityUseCase = new LogActivityUseCase();

// R-08: help types catalog and help assignment of a case
class CaseHelpController {
  async listHelpTypes(_req, res) {
    try {
      const helpTypes = await listHelpTypesUseCase.execute();

      return res.status(200).json({
        success: true,
        data: CaseHelpsDTO.fromHelpTypes(helpTypes),
      });
    } catch (error) {
      // Keep database details in server logs instead of exposing them to clients.
      console.error('Failed to list help types:', error);

      return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Unable to retrieve help types.',
      });
    }
  }

  async assignCaseHelps(req, res) {
    try {
      const result = await assignCaseHelpsUseCase.execute(
        req.params.caseId,
        req.body
      );

      // V-06: who assigned the helps appears in the activity log
      await logActivityUseCase.execute({
        actorId: req.user.user_id,
        action: 'assign_case_help',
        entity: 'case',
        entityId: result.caseId,
        details: { helpIds: result.helps.map((help) => help.help_id) },
      });

      return res.status(200).json({
        success: true,
        data: CaseHelpsDTO.fromAssignment(result),
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        // Keep database details in server logs instead of exposing them to clients.
        console.error('Failed to assign case helps:', error);

        return res.status(500).json({
          success: false,
          code: 'SERVER_ERROR',
          error: 'Unable to assign case helps.',
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
}

export default new CaseHelpController();
