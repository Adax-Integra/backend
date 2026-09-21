import UserIdValidator from '../../Data/Validators/userId.validator';
import CasesModel from '../../Data/Models/cases.model';

// Recieves a valid userId and returns
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
