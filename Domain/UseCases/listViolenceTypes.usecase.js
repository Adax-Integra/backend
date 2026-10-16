import ViolenceTypeModel from '../../Data/Models/violenceType.model.js';

class ListViolenceTypesUseCase {
  async execute() {
    return await ViolenceTypeModel.findAllActive();
  }
}

export default ListViolenceTypesUseCase;
