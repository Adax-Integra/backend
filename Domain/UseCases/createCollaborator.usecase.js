// import bcrypt from 'bcrypt'; --- Laura deleted this
import AuthUserModel from '../../Data/Models/authUser.model.js'; // Laura added this

import CreateCollaboratorValidator from '../../Data/Validators/createCollaborator.validator.js';
import UserModel from '../../Data/Models/user.model.js';
import RoleModel from '../../Data/Models/role.model.js';
import InternalUserModel from '../../Data/Models/internalUser.model.js';

const INTERNAL_ROLE = 'internal';
// const BCRYPT_SALT_ROUNDS = 10; --- Laura deleted this

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
    const userId = await AuthUserModel.create(
      collaborator.email,
      collaborator.password
    ); // Laura added this
    // Supabase Auth stores the password and gives us the user id --- Laura added this

    /* store only the encrypted version of the password
    const hashedPassword = await bcrypt.hash(
      collaborator.password,
      BCRYPT_SALT_ROUNDS
    );
    */ // Laura deleted this

    let user; // --- Laura added this
    // Declared outside the try so it can be returned at the end
    try {
      // --- Laura added this
      // If saving the profile fails, delete the auth account so no half-created user is left behind
      user = await InternalUserModel.create({
        userId, // Laura added this
        name: collaborator.name,
        lastName: collaborator.lastName,
        email: collaborator.email,
        // hashedPassword, --- Laura deleted this
        phone: collaborator.phone,
        roleId,
      });
    } catch (error) {
      // --- Laura added this
      // remove the login account so no half-created user is left behind
      await AuthUserModel.delete(userId);
      throw error;
    }

    return { user, role: INTERNAL_ROLE };
  }
}

export default CreateCollaboratorUseCase;
