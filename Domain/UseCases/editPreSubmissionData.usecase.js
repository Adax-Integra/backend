import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import AddressModel from '../../Data/Models/address.model.js';
import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';
import EditPreSubmissionValidator from '../../Data/Validators/editPreSubmission.validator.js';
import UserIdValidator from '../../Data/Validators/userId.validator';

class EditPreSubmissionDataUseCase {
  async execute(userId, updateData) {
    const validUserId = UserIdValidator.validateUserId(userId);
    const { profile, address, documents } =
      EditPreSubmissionValidator.validateUpdateBody(updateData, validUserId);

    const result = {
      profile: null,
      address: null,
      documents: null,
    };

    if (Object.keys(profile).length > 0) {
      result.profile = await ExternalUserModel.updateProfile(
        validUserId,
        profile
      );
    } else {
      result.profile = await ExternalUserModel.findProfileById(validUserId);
    }

    if (Object.keys(address).length > 0) {
      result.address = await AddressModel.updateByUserId(validUserId, address);
    } else {
      result.address = await AddressModel.findByUserId(validUserId);
    }

    if (Object.keys(documents).length > 0) {
      result.documents = await ExternalUserDocumentsModel.updateByUserId(
        validUserId,
        documents
      );
    } else {
      result.documents =
        await ExternalUserDocumentsModel.findByUserId(validUserId);
    }

    return result;
  }
}

export default EditPreSubmissionDataUseCase;
