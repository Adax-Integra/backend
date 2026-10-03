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

  // G-07: tells the external user her data changed without listing the new
  // values, in case someone else has access to her inbox
  static async sendProfileUpdatedNotice(email) {
    if (!transporter) {
      console.warn(
        `[mailer] SMTP not configured. Profile update notice for ${email} was not emailed.`
      );
      return;
    }

    await transporter.sendMail({
      from: MAIL_FROM ?? MAIL_USER,
      to: email,
      subject: 'Actualización de tus datos en Adax',
      text:
        'Te informamos que el equipo de Adax actualizó los datos de tu cuenta con tu autorización.\n\n' +
        'Si no reconoces este cambio, siéntete libre de comunicarte con Adax por sus medios oficiales.',
    });
  }
}

export default MailerService;
