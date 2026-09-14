import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';
import EditPreSubmissionValidator from '../../Data/Validators/editPreSubmission.validator.js';

class EditPreSubmissionDataUseCase {
  async execute(userId, updateData) {
    const validUserId = EditPreSubmissionValidator.validateUserId(userId);
    const { profile, documents } =
      EditPreSubmissionValidator.validateUpdateBody(updateData, validUserId);

    const result = {
      profile: null,
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
