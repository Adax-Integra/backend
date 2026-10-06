import UserModel from '../../Data/Models/user.model.js';
import PasswordRecoveryModel from '../../Data/Models/passwordRecovery.model.js';
import MailerService from '../../data/Services/mailer.service.js';
import PasswordValidator from '../../data/validators/password.validator.js';

import crypto from 'crypto';
import bcrypt from 'bcrypt';
const BCRYPT_SALT_ROUNDS = 10;

class PasswordRecoveryUseCase {
  async forgotPassword(email) {
    //validates email, returning clean version
    const cleanEmail = email?.trim();

    //empty email throws 400 error
    if (!cleanEmail) {
      const error = new Error('Favor de ingresar correo.');
      error.status = 400;
      throw error;
    }

    //check for valid email format
    const emailRegex = /^[\w-_.]+@([\w-]+.)+[\w-]{2,4}$/;

    if (!emailRegex.test(cleanEmail)) {
      const error = new Error('Favor de ingresar un correo válido.');
      error.status = 400;
      throw error;
    }

    //find user by email
    const user = await UserModel.findByEmail(cleanEmail);

    //generic response even if email does not exist
    if (!user) {
      return {
        message: 'Si el correo existe, se envió un enlace',
      };
    }

    //generate a secure random token
    const recoveryToken = crypto.randomBytes(32).toString('hex');

    //hash the token for storage
    const tokenHash = crypto
      .createHash('sha256')
      .update(recoveryToken)
      .digest('hex');

    //set expiration time for the token (1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    //check if a recovery record already exists for the user
    const existingRecord = await PasswordRecoveryModel.findByUserId(
      user.user_id
    );

    if (existingRecord) {
      //update the existing record with the new token and expiration
      await PasswordRecoveryModel.updateRecoveryRecord(
        existingRecord.recovery_id,
        tokenHash,
        expiresAt
      );
    } else {
      //otherwise, create a new recovery record
      await PasswordRecoveryModel.createRecoveryRecord(
        user.user_id,
        tokenHash,
        expiresAt
      );
    }

    await MailerService.sendPasswordRecoveryEmail(cleanEmail, recoveryToken);

    //send the recovery email with the token
    return {
      message: 'Si el correo existe, se envió un enlace',
    };
  }

  //validate token has not been used and is not expired and that it exists
  async validateToken(token) {
    const cleanToken = token?.trim();

    if (!cleanToken) {
      const error = new Error('Token inválido.');
      error.status = 400;
      throw error;
    }

    //hash the token for comparison
    const tokenHash = crypto
      .createHash('sha256')
      .update(cleanToken)
      .digest('hex');

    //find the recovery record by token hash
    const recoveryRecord = await PasswordRecoveryModel.findByToken(tokenHash);

    if (!recoveryRecord) {
      const error = new Error('Token inválido o no encontrado.');
      error.status = 400;
      throw error;
    }

    //check if token has been used
    if (recoveryRecord.used_at) {
      const error = new Error('Token ya ha sido usado.');
      error.status = 400;
      throw error;
    }

    //check if token is expired
    const expiresAt = new Date(`${recoveryRecord.expires_at}Z`);

    if (expiresAt <= new Date()) {
      const error = new Error('Token ha expirado.');
      error.status = 400;
      throw error;
    }
    return {
      valid: true,
      userId: recoveryRecord.user_id,
      recoveryId: recoveryRecord.recovery_id,
    };
  }

  //password reset function, takes token and new password, validates token, hashes new password, updates user record, marks token as used
  async resetPassword(token, newPassword) {
    //validate recovery token
    const { userId, recoveryId } = await this.validateToken(token);

    const password = PasswordValidator.validatePassword(newPassword);

    //hash the new password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    await UserModel.recoverPassword(userId, hashedPassword);

    //mark token as used
    await PasswordRecoveryModel.markTokenAsUsed(recoveryId);

    return {
      message: 'Contraseña actualizada exitosamente.',
    };
  }
}

export default PasswordRecoveryUseCase;
