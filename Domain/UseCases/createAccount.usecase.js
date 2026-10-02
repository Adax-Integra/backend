import AuthUserModel from '../../Data/Models/authUser.model.js'; // Laura added this
// Creates the login account in Supabase Auth
// import bcrypt from 'bcrypt'; --- Laura deleted this

import CreateAccountValidator from '../../Data/Validators/createAccount.validator.js';
import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import RoleModel from '../../Data/Models/role.model.js';

const EXTERNAL_ROLE = 'external';
// const BCRYPT_SALT_ROUNDS = 10; --- Laura deleted this

// handles the steps needed for an external user to create an account
class CreateAccountUseCase {
  async execute(body) {
    // validate the information received from the registration form
    const account = CreateAccountValidator.validateBody(body);

    // checks if an account already uses this email
    const existingAccount = await ExternalUserModel.findByEmail(account.email);

    if (existingAccount) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    // gets the external role ID from the database
    const roleId = await RoleModel.findIdByDescription(EXTERNAL_ROLE);

    /*const hashedPassword = await bcrypt.hash(
      account.password,
      BCRYPT_SALT_ROUNDS
    );
    */ // Laura deleted this

    // Supabase Auth stores the password and gives us the user id --- Laura added this
    const userId = await AuthUserModel.create(account.email, account.password);

    try {
      // --- Laura added this
      // If saving the profile fails the auth account is deleted so no half-created user is left behind
      return await ExternalUserModel.createAccount({
        userId, // Laura added this
        name: account.name,
        lastName: account.lastName,
        email: account.email,
        phone: account.phone,
        // hashedPassword, --- Laura deleted this
        roleId,
      });
    } catch (error) {
      // --- Laura added this
      // Delete the auth account created above because its profile could not be saved
      await AuthUserModel.delete(userId);
      // Pass the error to the controller (the original error)
      throw error;
    }
  }
}

export default CreateAccountUseCase;
