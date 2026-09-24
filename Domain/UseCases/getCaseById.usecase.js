import CaseModel from '../../Data/Models/case.model.js';
import CaseIdValidator from '../../Data/Validators/caseId.validator.js';

//model will receive operation
class GetCaseByIdUseCase {
  async execute(caseId) {
    const validCaseId = CaseIdValidator.validateCaseId(caseId);

    const caseData = await CaseModel.findById(validCaseId);

    if (!caseData) {
      throw new Error(`Case with ID ${validCaseId} not found.`);
    }

    return caseData;
  }
}

export default GetCaseByIdUseCase;
