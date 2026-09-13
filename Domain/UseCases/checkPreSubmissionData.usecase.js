import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import AddressModel from '../../Data/Models/address.model.js';

class CheckPreSubmissionDataUseCase {
  async execute(userId) {
    if (!userId) {
      throw new Error('userId is required.');
    }

    const [profile, address] = await Promise.all([
      ExternalUserModel.findProfileById(userId),
      AddressModel.findByUserId(userId),
    ]);

    return { profile, address };
  }
}

export default CheckPreSubmissionDataUseCase;
