import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import AddressModel from '../../Data/Models/address.model.js';
import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';

class CheckPreSubmissionDataUseCase {
  async execute(userId) {
    if (!userId) {
      throw new Error('userId is required.');
    }

    const [profile, address, documents] = await Promise.all([
      ExternalUserModel.findProfileById(userId),
      AddressModel.findByUserId(userId),
      ExternalUserDocumentsModel.findByUserId(userId),
    ]);

    return {
      profile,
      address,
      documents: await ExternalUserDocumentsModel.attachSignedUrls(documents),
    };
  }
}

export default CheckPreSubmissionDataUseCase;
