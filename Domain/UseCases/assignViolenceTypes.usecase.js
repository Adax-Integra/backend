import CaseModel from '../../Data/Models/case.model.js';
import AssignViolenceTypesValidator from '../../Data/Validators/assignViolenceTypes.validator.js';

// Validates and assigns violence types to a case (R-07)
class AssignViolenceTypesUseCase {
  async execute(caseId, violenceIds) {
    const validCaseId = AssignViolenceTypesValidator.validateCaseId(caseId);
    const validViolenceIds =
      AssignViolenceTypesValidator.validateViolenceIds(violenceIds);

    return await CaseModel.assignViolenceTypes(validCaseId, validViolenceIds);
  }
}

export default AssignViolenceTypesUseCase;
