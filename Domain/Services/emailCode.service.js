import crypto from 'node:crypto';

import EmailCodeModel from '../../Data/Models/emailCode.model.js';
import MailerService from '../../Data/Services/mailer.service.js';

export const EMAIL_CODE_PURPOSE = {
  VERIFY_EMAIL: 'verify_email',
  RESET_PASSWORD: 'reset_password',
};

const CODE_TTL_MS = 15 * 60 * 1000; // a code is valid for 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // wait 60 s between emails
const MAX_SENDS = 3; // emails allowed while the code is still valid
const MAX_ATTEMPTS = 5; // wrong codes allowed before blocking

// Builds an error with HTTP status and a stable code the app can read
function createError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// HMAC instead of a plain sha256: there are only 1,000,000 possible codes,
// so without the server secret a leaked hash could be reversed in seconds
function hashCode(code) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(code)
    .digest('hex');
}

// Compares in constant time so response time does not leak how many characters matched
function hashesMatch(a, b) {
  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');

  return (
    bufferA.length === bufferB.length &&
    crypto.timingSafeEqual(bufferA, bufferB)
  );
}

class EmailCodeService {
  // Generates a new 6 digit code, stores its hash and emails it to the user
  static async issueCode({ userId, email, purpose }) {
    const now = Date.now();
    const existing = await EmailCodeModel.find(userId, purpose);
    let sendCount = 1;

    if (existing) {
      const elapsed = now - new Date(existing.last_sent_at).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        throw createError(
          'Espera un momento antes de solicitar otro código.',
          429,
          'RESEND_TOO_SOON'
        );
      }

      const stillValid = new Date(existing.expires_at).getTime() > now;
      if (stillValid && existing.send_count >= MAX_SENDS) {
        throw createError(
          'Límite de reenvíos superado. Inténtalo más tarde.',
          429,
          'TOO_MANY_SENDS'
        );
      }

      // the counter only grows while the previous code is still valid
      sendCount = stillValid ? existing.send_count + 1 : 1;
    }

    // randomInt is cryptographically secure; padStart keeps leading zeros ("004213")
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

    await EmailCodeModel.upsert({
      userId,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
      sendCount,
    });

    await MailerService.sendEmailCode(email, code, purpose);

    return { sendCount, maxSends: MAX_SENDS };
  }

  // Validates the code; deletes it on success so it can only be used once
  static async consumeCode({ userId, purpose, code }) {
    const record = await EmailCodeModel.find(userId, purpose);

    if (!record) {
      throw createError('Código incorrecto.', 400, 'CODE_INVALID');
    }

    if (new Date(record.expires_at).getTime() <= Date.now()) {
      throw createError(
        'El código expiró. Solicita uno nuevo.',
        400,
        'CODE_EXPIRED'
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw createError(
        'Demasiados intentos. Solicita un código nuevo.',
        429,
        'TOO_MANY_ATTEMPTS'
      );
    }

    if (!hashesMatch(hashCode(String(code ?? '')), record.code_hash)) {
      await EmailCodeModel.setAttempts(userId, purpose, record.attempts + 1);
      throw createError('Código incorrecto.', 400, 'CODE_INVALID');
    }

    await EmailCodeModel.remove(userId, purpose);
  }
}

export default EmailCodeService;
