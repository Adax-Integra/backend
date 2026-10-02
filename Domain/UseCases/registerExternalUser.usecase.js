import crypto from 'node:crypto';
// import bcrypt from 'bcrypt'; --- Laura deleted this
import AuthUserModel from '../../Data/Models/authUser.model.js'; // Laura added this

import RegisterExternalUserValidator from '../../Data/Validators/registerExternalUser.validator.js';
import RoleModel from '../../Data/Models/role.model.js';
import externalUserModel from '../../Data/Models/externalUser.model.js';
import MailerService from '../../Data/Services/mailer.service.js';

const EXTERNAL_ROLE = 'external';
const TEMP_PASSWORD_BYTES = 12;
// const BCRYPT_SALT_ROUNDS = 10; --- Laura deleted this

// External user signup by internal user use case
class RegisterExternalUserUseCase {
  async execute(body) {
    const { profile, address } =
      RegisterExternalUserValidator.validateBody(body);

    const existing = await externalUserModel.findByEmail(profile.email);
    if (existing) {
      throw new Error('An external user with this email already exists.');
    }

    const roleId = await RoleModel.findIdByDescription(EXTERNAL_ROLE);

    const temporaryPassword = crypto
      .randomBytes(TEMP_PASSWORD_BYTES)
      .toString('base64url');

    /* const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      BCRYPT_SALT_ROUNDS
    );
    */ // Laura deleted this

    /*const created = await externalUserModel.create({
      profile,
      address,
      roleId,
      hashedPassword,
    });
    */ // Laura deleted this

    // Supabase Auth stores the password and gives us the user id --- Laura added this
    const userId = await AuthUserModel.create(profile.email, temporaryPassword);

    let created;
    // Declared outside the try so it can be returned at the end
    try {
      // If saving the profile fails, delete the auth account so no half-created user is left behind
      created = await externalUserModel.create({
        userId, // Laura added this
        profile,
        address,
        roleId,
      });
    } catch (error) {
      // Delete the login account if something fails
      await AuthUserModel.delete(userId);
      // Re-throw the original error so the controller can respond to the client
      throw error;
    }

    try {
      await MailerService.sendTemporaryPassword(
        profile.email,
        temporaryPassword
      );
    } catch (error) {
      console.error(
        '[register-external] Failed to send temporary password email:',
        error
      );
    }

    return created;
  }
}

export default RegisterExternalUserUseCase;
