import UserModel from '../../Data/Models/user.model.js';
import EmailValidator from '../../Data/Validators/email.validator.js';
import EmailCodeService, {
  EMAIL_CODE_PURPOSE,
} from '../Services/emailCode.service.js';

const GENERIC_MESSAGE =
  'Si el correo está registrado y pendiente de verificar, enviamos un código nuevo.';

// G-09: sends a new verification code to an unverified account
class ResendVerificationUseCase {
  async execute(body = {}) {
    const email = EmailValidator.validateEmail(body.email).toLowerCase();
    const user = await UserModel.findByEmail(email);

    // same answer when the email does not exist or is already verified,
    // so the endpoint cannot be used to discover registerd emails
    if (!user || user.email_verified_at) {
      return { message: GENERIC_MESSAGE };
    }

    // may throe 429 RESEND_TO0_SOON or TOO_MANY_SENDS
    await EmailCodeService.issueCode({
      userId: user.user_id,
      email,
      purpose: EMAIL_CODE_PURPOSE.VERIFY_EMAIL,
    });

    return { message: GENERIC_MESSAGE };
  }
}

export default ResendVerificationUseCase;
