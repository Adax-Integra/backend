import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import CaseViolenceModel from '../../Data/Models/caseViolence.model.js';

class AssignViolenceTypesUseCase {
  async execute(caseId, body) {
    const validCaseId = ValidIdValidator.validateId(caseId, 'caseId');

    if (!body || !Array.isArray(body.violenceIds)) {
      const error = new Error('violenceIds must be an array.');
      error.status = 400;
      throw error;
    }

    const violenceIds = body.violenceIds.map((id) =>
      ValidIdValidator.validateId(id, 'violenceId').toLowerCase()
    );

    if (new Set(violenceIds).size !== violenceIds.length) {
      const error = new Error('Duplicate violence types are not allowed.');
      error.status = 400;
      throw error;
    }

    return await CaseViolenceModel.replaceForCase(validCaseId, violenceIds);
  }
}

export default AssignViolenceTypesUseCase;
