import CountriesAndStatesModel from '../../Data/Models/countriesAndStates.model.js';

class GetAllCountriesWithStates {
  async execute() {
    return await CountriesAndStatesModel.getAllCountriesWithStates();
  }
}

export default GetAllCountriesWithStates;
