import CountriesAndStatesModel from '../../Data/Models/countriesAndStates.model.js';

class GetAllCountriesWithStatesUseCase {
  async execute() {
    return await CountriesAndStatesModel.getAllCountriesWithStates();
  }
}

export default GetAllCountriesWithStatesUseCase;
