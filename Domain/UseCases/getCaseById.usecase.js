import CaseModel from '../../Data/Models/case.model.js';

//model will receive operation
class GetCaseByIdUseCase {
  async execute(caseId) {
    const caseData = await CaseModel.findById(caseId);

    if (!caseData) {
      throw new Error(`Case with ID ${caseId} not found.`);
    }
    return caseData;
  }
}

export default GetCaseByIdUseCase;
