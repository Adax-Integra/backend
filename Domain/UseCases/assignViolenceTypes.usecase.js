import CaseModel from '../../Data/Models/case.model.js';
import ValidIdValidator from '../../Data/Validators/validId.validator.js';

// Validates and assigns violence types to a case (R-07)
class AssignViolenceTypesUseCase {
  async execute(caseId, violenceIds) {
    const validCaseId = ValidIdValidator.validateId(caseId, 'caseId');

    if (!Array.isArray(violenceIds)) {
      const error = new Error('violenceIds must be an array.');
      error.status = 400;
      throw error;
    }

    const validViolenceIds = violenceIds.map((id) =>
      ValidIdValidator.validateId(id, 'violenceId').toLowerCase()
    );

    const uniqueIds = new Set(validViolenceIds.map((id) => id.toLowerCase()));

    if (uniqueIds.size !== validViolenceIds.length) {
      const error = new Error('Duplicate violence types are not allowed.');
      error.status = 400;
      throw error;
    }

    return await CaseModel.assignViolenceTypes(validCaseId, validViolenceIds);
  }
}

export default AssignViolenceTypesUseCase;
