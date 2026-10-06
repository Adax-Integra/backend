import bcrypt from 'bcrypt';

import CreateAccountValidator from '../../Data/Validators/createAccount.validator.js';
import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import RoleModel from '../../Data/Models/role.model.js';

const EXTERNAL_ROLE = 'external';
// number of rounds used by bcrypt to hash the password
const BCRYPT_SALT_ROUNDS = 10;

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

    // store only the encrypted version of the password
    const hashedPassword = await bcrypt.hash(
      account.password,
      BCRYPT_SALT_ROUNDS
    );

    // pases the account data, password hash, and rode ID to the model
    return ExternalUserModel.createAccount({
      name: account.name,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      hashedPassword,
      roleId,
    });
  }
}

export default CreateAccountUseCase;
