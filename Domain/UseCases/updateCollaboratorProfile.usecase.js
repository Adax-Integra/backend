import UserIdValidator from '../../Data/Validators/userId.validator.js';
import UpdateCollaboratorProfileValidator from '../../Data/Validators/updateCollaboratorProfile.validator.js';
import RoleModel from '../../Data/Models/role.model.js';
import InternalUserModel from '../../Data/Models/internalUser.model.js';
import MailerService from '../../Data/Services/mailer.service.js';

const INTERNAL_ROLE = 'internal';

function requestError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getChangedFields(section, newValues, currentValues) {
  return Object.entries(newValues)
    .filter(([key, value]) => (currentValues?.[key] ?? null) !== value)
    .map(([key, value]) => ({
      field: `${section}.${key}`,
      old: currentValues?.[key] ?? null,
      new: value,
    }));
}

class UpdateCollaboratorProfileUseCase {
  async execute(actorId, userId, body) {
    const validUserId = UserIdValidator.validateUserId(userId);
    const { profile } =
      UpdateCollaboratorProfileValidator.validateUpdateBody(body);

    const roles = await RoleModel.findRolesByUserId(validUserId);
    if (!roles.includes(INTERNAL_ROLE)) {
      throw requestError('Collaborator not found', 404);
    }

    const currentProfile =
      await InternalUserModel.findEditableProfileById(validUserId);

    if (!currentProfile) {
      throw requestError('Collaborator not found', 404);
    }

    const changes = getChangedFields('profile', profile, currentProfile);

    if (changes.length === 0) {
      throw requestError('The submitted data has no changes', 400);
    }

    const emailChanged = changes.some(
      (change) => change.field === 'profile.email'
    );

    if (emailChanged) {
      const existing = await InternalUserModel.findByEmail(profile.email);
      if (existing && existing.user_id !== validUserId) {
        throw requestError('This email is already registered', 409);
      }
    }
    const updated = await InternalUserModel.updateProfileWithLog({
      userId: validUserId,
      actorId,
      profile,
      changes,
    });

    const recipients = emailChanged
      ? [currentProfile.email, profile.email]
      : [currentProfile.email];
    for (const email of recipients) {
      try {
        await MailerService.sendProfileUpdatedNotice(email);
      } catch (error) {
        console.error(
          '[update-collaborator-profile] Failed to send profile notice:',
          error
        );
      }
    }

    return updated;
  }
}

export default UpdateCollaboratorProfileUseCase;
