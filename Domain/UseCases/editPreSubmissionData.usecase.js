import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import EditPreSubmissionValidator from '../../Data/Validators/editPreSubmission.validator.js';

class EditPreSubmissionDataUseCase {
  async execute(userId, updateData) {
    const validUserId = EditPreSubmissionValidator.validateUserId(userId);
    const payload = EditPreSubmissionValidator.validateUpdateBody(updateData);

    return ExternalUserModel.updateProfile(validUserId, payload);
  }
}

export default EditPreSubmissionDataUseCase;
