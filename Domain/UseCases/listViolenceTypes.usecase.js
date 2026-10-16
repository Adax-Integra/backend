import CaseModel from '../../Data/Models/case.model.js';

// Retrieves available violence types for R-07
class ListViolenceTypesUseCase {
  async execute() {
    return await CaseModel.getActiveViolenceTypes();
  }
}

export default ListViolenceTypesUseCase;
