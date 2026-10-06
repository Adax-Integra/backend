import UserIdValidator from '../../Data/Validators/userId.validator.js';
import UpdateExternalProfileValidator from '../../Data/Validators/updateExternalProfile.validator.js';
import RoleModel from '../../Data/Models/role.model.js';
import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import AddressModel from '../../Data/Models/address.model.js';
import MailerService from '../../Data/Services/mailer.service.js';

const EXTERNAL_ROLE = 'external';

function requestError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Keeps only the fields whose value is different from the stored one,
// so the log does not record changes that did not happen
function getChangedFields(section, newValues, currentValues) {
  return Object.entries(newValues)
    .filter(([key, value]) => (currentValues?.[key] ?? null) !== value)
    .map(([key, value]) => ({
      field: `${section}.${key}`,
      old: currentValues?.[key] ?? null,
      new: value,
    }));
}

// G-07: the admin updates the text data of an external user
class UpdateExternalProfileUseCase {
  async execute(actorId, userId, body) {
    const validUserId = UserIdValidator.validateUserId(userId);
    const { profile, address, reason } =
      UpdateExternalProfileValidator.validateUpdateBody(body);

    // Staff accounts cannot be edited through this endpoint
    const roles = await RoleModel.findRolesByUserId(validUserId);
    if (!roles.includes(EXTERNAL_ROLE)) {
      throw requestError('External user not found', 404);
    }

    const [currentProfile, currentAddress] = await Promise.all([
      ExternalUserModel.findEditableProfileById(validUserId),
      AddressModel.findByUserId(validUserId),
    ]);

    if (!currentProfile) {
      throw requestError('External user not found', 404);
    }

    const changes = [
      ...getChangedFields('profile', profile, currentProfile),
      ...getChangedFields('address', address, currentAddress),
    ];

    if (changes.length === 0) {
      throw requestError('The submitted data has no changes', 400);
    }

    const emailChanged = changes.some(
      (change) => change.field === 'profile.email'
    );

    if (emailChanged) {
      const existing = await ExternalUserModel.findByEmail(profile.email);
      if (existing && existing.user_id !== validUserId) {
        throw requestError('This email is already registered', 409);
      }
    }

    const updated = await ExternalUserModel.updateProfileWithLog({
      userId: validUserId,
      actorId,
      profile,
      address,
      changes,
      reason,
    });

    // When the email changes, both inboxes receive the notice
    const recipients = emailChanged
      ? [currentProfile.email, profile.email]
      : [currentProfile.email];
    for (const email of recipients) {
      try {
        await MailerService.sendProfileUpdatedNotice(email);
      } catch (error) {
        // The change is already saved, a failed email should not undo it
        console.error(
          '[update-external-profile] Failed to send profile notice:',
          error
        );
      }
    }

    return updated;
  }
}

export default UpdateExternalProfileUseCase;
