import UserModel from '../../Data/Models/user.model.js';
import EmailValidator from '../../Data/Validators/email.validator.js';
import EmailCodeService, {
  EMAIL_CODE_PURPOSE,
} from '../Services/emailCode.service.js';
import SessionService from '../Services/session.service.js';

const CODE_PATTERN = /^\d{6}$/;

// Builds an error with HTTP status and a stable code the app can read
function createError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// G-09: checks the 6 digit code, marks the email as verified and logs the user in
class VerifyEmailUseCase {
  async execute(body = {}) {
    const email = EmailValidator.validateEmail(body.email).toLowerCase();
    const code = String(body.code ?? '').trim();

    if (!CODE_PATTERN.test(code)) {
      throw createError('El código debe tener 6 dígitos.', 400, 'CODE_INVALID');
    }

    const user = await UserModel.findByEmail(email);

    // same answer as a wrong code, so the endpoint does not reveal which emails exist
    if (!user) {
      throw createError('Código incorrecto.', 400, 'CODE_INVALID');
    }

    // never log in without a code check: an already verified account must use login
    if (user.email_verified_at) {
      throw createError(
        'Esta cuenta ya está verificada. Inicia sesión.',
        409,
        'ALREADY_VERIFIED'
      );
    }

    await EmailCodeService.consumeCode({
      userId: user.user_id,
      purpose: EMAIL_CODE_PURPOSE.VERIFY_EMAIL,
      code,
    });

    await UserModel.markEmailVerified(user.user_id);

    return SessionService.createSession(user.user_id);
  }
}

export default VerifyEmailUseCase;
