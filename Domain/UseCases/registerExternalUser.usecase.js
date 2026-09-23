import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

import RegisterExternalUserValidator from '../../Data/Validators/registerExternalUser.validator.js';
import RoleModel from '../../Data/Models/role.model.js';
import RegisterExternalUserModel from '../../Data/Models/registerExternalUser.model.js';
import MailerService from '../../Data/Services/mailer.service.js';

const EXTERNAL_ROLE = 'external';
const TEMP_PASSWORD_BYTES = 12;
const BCRYPT_SALT_ROUNDS = 10;

class RegisterExternalUserUseCase {
  async execute(body) {
    const { profile, address } =
      RegisterExternalUserValidator.validateBody(body);

    const existing = await RegisterExternalUserModel.findByEmail(profile.email);
    if (existing) {
      throw new Error('An external user with this email already exists.');
    }

    const roleId = await RoleModel.findIdByDescription(EXTERNAL_ROLE);

    const temporaryPassword = crypto
      .randomBytes(TEMP_PASSWORD_BYTES)
      .toString('base64url');
    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      BCRYPT_SALT_ROUNDS
    );

    const created = await RegisterExternalUserModel.create({
      profile,
      address,
      roleId,
      hashedPassword,
    });

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
