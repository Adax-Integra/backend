import UserIdValidator from '../../Data/Validators/userId.validator.js';
import CasesModel from '../../Data/Models/cases.model.js';
import { calculateCaseUrgency } from '../../Data/Services/caseUrgency.helper.js';

// Recieves a valid userId and gets the cases from that user
class GetAllCasesFromUser {
  async execute(userId) {
    const validUserId = UserIdValidator.validateUserId(userId);

    const [cases] = await Promise.all([
      CasesModel.getAllCasesFromUser(validUserId),
    ]);

    return {
      cases: cases.map((caseData) => ({
        ...caseData,
        ...calculateCaseUrgency(caseData.case_violence),
      })),
    };
  }
}

export default GetAllCasesFromUser;
