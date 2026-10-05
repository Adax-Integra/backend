import UserIdValidator from '../../Data/Validators/userId.validator.js';
import RoleModel from '../../Data/Models/role.model.js';
import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import AddressModel from '../../Data/Models/address.model.js';

const EXTERNAL_ROLE = 'external';

function notFoundError() {
  const error = new Error('External user not found');
  error.status = 404;
  return error;
}

// G-07: data the admin reviews before editing an external user
class GetExternalProfileUseCase {
  async execute(userId) {
    const validUserId = UserIdValidator.validateUserId(userId);

    // The admin can only open accounts that belong to external users
    const roles = await RoleModel.findRolesByUserId(validUserId);
    if (!roles.includes(EXTERNAL_ROLE)) {
      throw notFoundError();
    }

    const [profile, address] = await Promise.all([
      ExternalUserModel.findEditableProfileById(validUserId),
      AddressModel.findByUserId(validUserId),
    ]);

    if (!profile) {
      throw notFoundError();
    }

    return { profile, address };
  }
}

export default GetExternalProfileUseCase;
