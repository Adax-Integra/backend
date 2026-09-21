import UserIdValidator from '../../Data/Validators/userId.validator.js';
import CasesModel from '../../Data/Models/cases.model.js';

// Recieves a valid userId and gets the cases from that user
class GetAllCasesFromUser {
  async execute(userId) {
    const validUserId = UserIdValidator.validateUserId(userId);

    const [cases] = await Promise.all([
      CasesModel.getAllCasesFromUser(validUserId),
    ]);

    return { cases };
  }
}

export default GetAllCasesFromUser;
