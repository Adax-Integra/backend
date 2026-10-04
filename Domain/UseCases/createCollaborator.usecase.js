import bcrypt from 'bcrypt';

import CreateCollaboratorValidator from '../../Data/Validators/createCollaborator.validator.js';
import UserModel from '../../Data/Models/user.model.js';
import RoleModel from '../../Data/Models/role.model.js';
import InternalUserModel from '../../Data/Models/internalUser.model.js';

const INTERNAL_ROLE = 'internal';
const BCRYPT_SALT_ROUNDS = 10;

// G-03: The admin creates a new collaborator (internal user) account
class CreateCollaboratorUseCase {
  async execute(body) {
    const collaborator = CreateCollaboratorValidator.validateBody(body);

    // Acceptance criteria: an existing account cannot be registered again
    const existingAccount = await UserModel.findByEmail(collaborator.email);
    if (existingAccount) {
      const error = new Error('An account with this email already exists.');
      error.status = 409;
      error.details = { email: 'An account with this email already exists.' };
      throw error;
    }

    // the role is assigned by the backend, the admin cannot choose it
    const roleId = await RoleModel.findIdByDescription(INTERNAL_ROLE);

    // store only the encrypted version of the password
    const hashedPassword = await bcrypt.hash(
      collaborator.password,
      BCRYPT_SALT_ROUNDS
    );

    const user = await InternalUserModel.create({
      name: collaborator.name,
      lastName: collaborator.lastName,
      email: collaborator.email,
      hashedPassword,
      phone: collaborator.phone,
      roleId,
    });

    return { user, role: INTERNAL_ROLE };
  }
}

export default CreateCollaboratorUseCase;
