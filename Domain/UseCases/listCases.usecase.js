import CaseModel from '../../data/models/case.model.js';

class ListCasesUseCase {
  // Collaborator authorization must be added before exposing this listing.
  async execute({ page = 1, limit = 20 } = {}) {
    return CaseModel.findAll({ page, limit });
  }
}

export default ListCasesUseCase;
