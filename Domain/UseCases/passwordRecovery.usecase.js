import UserModel from '../../Data/Models/user.model.js';
import PasswordRecoveryModel from '../../Data/Models/passwordRecovery.model.js';

import crypto from 'crypto';

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

    //send the recovery email with the token
    return {
      message: 'Si el correo existe, se envió un enlace',
    };
  }
}

export default PasswordRecoveryUseCase;
