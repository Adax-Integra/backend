import RecordModel from '../../Data/Models/record.model.js';

class ListRecordsUseCase {
  // Keep filtering and pagination in the database through th model
  async execute({ page = 1, search = '', hasOpenCases = null, status = null } = {}) {
    return RecordModel.findAll({
      page,
      search,
      hasOpenCases,
      status,
    });
  }
}

export default ListRecordsUseCase;
