import ProfileModel from '../../Data/Models/profile.model.js';
import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import UpdateProfileValidator, {
  STAFF_EDITABLE_FIELDS,
  EXTERNAL_EDITABLE_FIELDS,
} from '../../Data/Validators/updateProfile.validator.js';

function requestError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/*
Admin and Internal users edit only their personal data, 
external users also edit their address.
*/
function getEditableFields(roles = []) {
  if (roles.includes('admin') || roles.includes('internal')) {
    return STAFF_EDITABLE_FIELDS;
  }
  if (roles.includes('external')) {
    return EXTERNAL_EDITABLE_FIELDS;
  }
  return null;
}

// R-04: The user edits their own profile
class UpdateProfileUseCase {
  async execute(userId, roles, body) {
    const editableFields = getEditableFields(roles);
    if (!editableFields) {
      throw requestError('You do not have permission', 403);
    }

    const { profile, address } = UpdateProfileValidator.validateUpdateBody(
      body,
      editableFields
    );

    // Admin and Internal accounts have no address, so only their user row changes
    const updated =
      editableFields === EXTERNAL_EDITABLE_FIELDS
        ? await ExternalUserModel.updateProfile(userId, profile, address)
        : await ProfileModel.updateProfileById(userId, profile);

    if (!updated) {
      throw requestError('user not found', 404);
    }
  }
}

export default UpdateProfileUseCase;
