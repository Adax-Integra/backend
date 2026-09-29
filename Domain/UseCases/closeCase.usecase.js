import CaseModel from '../../Data/Models/case.model.js';
import ValidIdValidator from '../../Data/Validators/validId.validator.js';

// close case for close button in getCaseDetail (V-11)
class CloseCaseUseCase {
  async execute(caseId) {
    const validCaseId = ValidIdValidator.validateId(caseId, 'caseId');
    const closedCase = await CaseModel.closeCase(validCaseId);

    if (!closedCase) {
      throw new Error(
        `Case with ID ${validCaseId} is already closed or does not exist.`
      );
    }
    return closedCase;
  }
}

export default CloseCaseUseCase;
