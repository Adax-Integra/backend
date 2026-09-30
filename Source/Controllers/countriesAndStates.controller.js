import GetAllCountriesWithStatesUseCase from '../../Domain/UseCases/getAllCountriesWithStates.usecase.js';
import CountriesWithStatesDTO from '../DTOs/countriesWithStates.dto.js';

const getAllCountriesWithStatesUseCase = new GetAllCountriesWithStatesUseCase();

class CountriesAndStatesController {
  // We add "_" to req because the request doesn't need a body
  async getAllCountriesWithStates(_req, res) {
    try {
      const countries = await getAllCountriesWithStatesUseCase.execute();
      // Make all countries be returned with the DTO format
      const payload = countries.map((country) =>
        new CountriesWithStatesDTO(country).toJSON()
      );

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      console.error('Failed to return countries with states: ', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to return countries.',
      });
    }
  }
}

export default new CountriesAndStatesController();
