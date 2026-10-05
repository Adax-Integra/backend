import nodemailer from 'nodemailer';

const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM } = process.env;

const isMailConfigured = Boolean(
  MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS
);

const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT),
      secure: Number(MAIL_PORT) === 465,
      auth: { user: MAIL_USER, pass: MAIL_PASS },
    })
  : null;

class MailerService {
  static async sendTemporaryPassword(email, temporaryPassword) {
    if (!transporter) {
      console.warn(
        `[mailer] SMTP not configured. Temporary password for ${email} was not emailed.`
      );
      return;
    }

    await transporter.sendMail({
      from: MAIL_FROM ?? MAIL_USER,
      to: email,
      subject: 'Tu acceso temporal a Adax',
      text:
        'Se registró tu expediente en Adax.\n\n' +
        `Tu contraseña temporal es: ${temporaryPassword}\n\n` +
        'Ingresa a la app con tu correo y esta contraseña, y cámbiala en tu primer inicio de sesión.',
    });
  }

  //sends a password recovery email to the user with a recovery token
  static async sendPasswordRecoveryEmail(email, recoveryToken) {
    if (!transporter) {
      console.warn(
        '[mailer] SMTP not configured. Password recovery email for ${email} was not sent.'
      );
      return;
    }

    //send the email with the recovery token
    await transporter.sendMail({
      from: MAIL_FROM ?? MAIL_USER,
      to: email,
      subject: 'Recuperación de contraseña de Adax',
      text:
        'Se solicitó la recuperación de tu contraseña en Adax.\n\n' +
        `Tu enlace de recuperación es: ${recoveryToken}\n\n` +
        'Este código tiene una vigencia limitada. Si no solicitaste la recuperación de tu contraseña, ignora este correo.',
    });
  }
}

export default MailerService;
