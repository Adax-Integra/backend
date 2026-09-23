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
}

export default MailerService;
