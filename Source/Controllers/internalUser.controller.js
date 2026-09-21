import GetAllCasesFromUser from '../../Domain/UseCases/getAllCasesFromUser.usecase';
import getAllCasesDTO from '../DTOs/getAllCases.dto';

const getAllCasesFromUser = new GetAllCasesFromUser();

class InternalUserController {
  async getAllCasesFromUser(req, res) {
    try {
      const { userId } = req.params;
      const data = await getAllCasesFromUser.execute(userId);
      const payload = new getAllCasesDTO(data).toJson();

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
  }
}

export default new InternalUserController();
