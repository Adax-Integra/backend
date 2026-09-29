import CaseModel from '../../Data/Models/case.model.js';
import CaseIdValidator from '../../Data/Validators/caseId.validator.js';

// close case for close button in getCaseDetail (V-11)
class CloseCaseUseCase {
  async execute(caseId) {
    const validCaseId = CaseIdValidator.validateCaseId(caseId);
    const closedCase = await CaseModel.closeCase(validCaseId);

    // because we use an atomic upadte, if it returns null it means the case was already closed
    if (!closedCase) {
      throw new Error(
        `Case with ID ${validCaseId} is already closed or does not exist.`
      );
    }
    return closedCase;
  }
}

export default CloseCaseUseCase;
