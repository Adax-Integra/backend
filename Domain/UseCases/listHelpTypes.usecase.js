import CaseHelpModel from '../../Data/Models/caseHelp.model.js';

// R-08: help types the internal user can assign to a case

class ListHelpTypesUseCase {
  async execute() {
    return await CaseHelpModel.findAllHelpTypes();
  }
}

export default ListHelpTypesUseCase;
