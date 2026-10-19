import CaseModel from '../../Data/Models/case.model.js';

class UpdateCaseStepUseCase {
  async execute(caseId, targetStepNumber) {
    if (!caseId) {
      throw new Error('caseId is required');
    }
    if (!targetStepNumber || typeof targetStepNumber !== 'number') {
      throw new Error('A valid numeric stepNumber is required');
    }

    //verify the case exists and is not closed
    const existingCase = await CaseModel.findById(caseId);
    if (existingCase.state === 'Closed') {
      const error = new Error('Cannot update steps for a closed case.');
      error.status = 409;
      throw error;
    }

    //update steps from the model function
    const updatedCase = await CaseModel.updateCaseSteps(
      caseId,
      targetStepNumber
    );

    return updatedCase;
  }
}

export default UpdateCaseStepUseCase;
