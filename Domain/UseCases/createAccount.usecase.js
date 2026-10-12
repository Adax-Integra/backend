import bcrypt from 'bcrypt';

import CreateAccountValidator from '../../Data/Validators/createAccount.validator.js';
import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import RoleModel from '../../Data/Models/role.model.js';

import EmailCodeService, {
  EMAIL_CODE_PURPOSE,
} from '../Services/emailCode.service.js';

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
      error.status = 409;
      error.code = 'EMAIL_TAKEN';
      throw error;
    }

    // gets the external role ID from the database
    const roleId = await RoleModel.findIdByDescription(EXTERNAL_ROLE);

    // store only the encrypted version of the password
    const hashedPassword = await bcrypt.hash(
      account.password,
      BCRYPT_SALT_ROUNDS
    );

    // the RPC Returns { user, record_id, address_id, document_id }
    const created = await ExternalUserModel.createAccount({
      name: account.name,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      hashedPassword,
      roleId,
    });

    // G-09: email the 6 digit code. If sending fails the account still exists
    // and the user can ask for a new code from the verification screen

    try {
      await EmailCodeService.issueCode({
        userId: created.user.user_id,
        email: account.email,
        purpose: EMAIL_CODE_PURPOSE.VERIFY_EMAIL,
      });
    } catch (error) {
      console.error(
        '[create-account] Failed to send verification code: ',
        error
      );
    }

    return created.user;
  }
}

export default CreateAccountUseCase;
