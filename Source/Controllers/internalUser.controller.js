import GetAllCasesFromUser from '../../Domain/UseCases/getAllCasesFromUser.usecase.js';
import getAllCasesDTO from '../DTOs/getAllCases.dto.js';

const getAllCasesFromUser = new GetAllCasesFromUser();

class InternalUserController {
  getAllCasesFromUser = async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId parameter is required',
        });
      }

      const response = await getAllCasesFromUser.execute(userId);
      const rows = Array.isArray(response) ? response : response?.cases;

      if (!Array.isArray(rows)) {
        throw new Error('The cases use case must return an array of cases.');
      }

      const payload = getAllCasesDTO.fromRows(rows);

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export default new InternalUserController();
