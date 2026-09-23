import HelpTypesModel from '../../Data/Models/helpTypes.model.js';

//Feeds the ¿Qué ayuda esperas recibir? dropdown
class ListHelpTypesUseCase {
  async execute() {
    return await HelpTypesModel.findAllActicve();
  }
}

export default ListHelpTypesUseCase;
