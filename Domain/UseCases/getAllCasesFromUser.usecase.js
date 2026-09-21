import UserIdValidator from '../../Data/Validators/userId.validator';

class GetAllCasesFromUser {
  async execute(userId) {
    const validUserId = UserIdValidator.validateUserId(userId);
    return validUserId;
  }
}

export default GetAllCasesFromUser;
