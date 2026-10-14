import bcrypt from 'bcryptjs';

import UserModel from '../../Data/Models/user.model.js';
import EmailValidator from '../../Data/Validators/email.validator.js';
import PasswordValidator from '../../Data/Validators/password.validator.js';
import EmailCodeService, {
  EMAIL_CODE_PURPOSE,
} from '../Services/emailCode.service.js';

const BCRYPT_SALT_ROUNDS = 10;
const CODE_PATTERN = /^\d{6}$/;
const SILENT_CODES = new Set(['RESEND_TOO_SOON', 'TOO_MANY_SENDS']);

function createError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

class PasswordRecoveryUseCase {
  async forgotPassword(email) {
    //validates email, returning clean version
    const cleanEmail = EmailValidator.validateEmail(email).toLowerCase();
    const user = await UserModel.findByEmail(cleanEmail);

    //same response whether account exists or not
    const message = 'Si el correo está registrado, enviaremos un código.';

    if (!user) {
      return { message };
    }

    try {
      await EmailCodeService.issueCode({
        userId: user.user_id,
        email: cleanEmail,
        purpose: EMAIL_CODE_PURPOSE.RESET_PASSWORD,
      });
    } catch (error) {
      if (!SILENT_CODES.has(error.code)) {
        throw error;
      }
    }

    return { message };
  }

  async resetPassword(email, code, newPassword) {
    const cleanEmail = EmailValidator.validateEmail(email).toLowerCase();
    const cleanCode = String(code ?? '').trim();

    if (!CODE_PATTERN.test(cleanCode)) {
      throw createError('El código debe tener 6 dígitos.', 400, 'CODE_INVALID');
    }

    const password = PasswordValidator.validatePassword(newPassword);
    const user = await UserModel.findByEmail(cleanEmail);

    if (!user) {
      throw createError('Código incorrecto.', 400, 'CODE_INVALID');
    }

    //validate without deleting the code.
    await EmailCodeService.validateCode({
      userId: user.user_id,
      purpose: EMAIL_CODE_PURPOSE.RESET_PASSWORD,
      code: cleanCode,
    });

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const updatedUser = await UserModel.updatePassword(
      user.user_id,
      passwordHash
    );

    if (!updatedUser) {
      throw createError(
        'No se pudo actualizar la contraseña.',
        500,
        'PASSWORD_UPDATE_FAILED'
      );
    }

    //delete code only after update password
    await EmailCodeService.removeCode(
      user.user_id,
      EMAIL_CODE_PURPOSE.RESET_PASSWORD
    );

    return { message: 'Contraseña actualizada exitosamente.' };
  }
}

export default PasswordRecoveryUseCase;
