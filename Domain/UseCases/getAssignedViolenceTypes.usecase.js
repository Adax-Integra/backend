import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import CaseViolenceModel from '../../Data/Models/caseViolence.model.js';

class GetAssignedViolenceTypesUseCase {
  async execute(caseId) {
    const validCaseId = ValidIdValidator.validateId(caseId, 'caseId');

    return await CaseViolenceModel.findActiveByCaseId(validCaseId);
  }
}

export default GetAssignedViolenceTypesUseCase;
