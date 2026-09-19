import CaseModel from '../../data/models/case.model.js';

//model will receive operation
class GetCaseByIdUseCase {
    async execute(caseId) {
        return await CaseModel.findById(caseId);
    }
}

export default GetCaseByIdUseCase;