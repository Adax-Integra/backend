import ListHelpTypesUseCase from '../../Domain/UseCases/listHelpTypes.usecase.js';
import HelpTypeDTO from '../DTOs/helpType.dto.js';

const listHelpTypesUseCase = new ListHelpTypesUseCase();

class HelpTypeController {
  async listHelpTypes(_req, res) {
    try {
      const rows = await listHelpTypesUseCase.execute();
      const payload = HelpTypeDTO.fromRows(rows);

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      console.error('Failed to retrieve help types', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve help types',
      });
    }
  }
}

export default new HelpTypeController();
