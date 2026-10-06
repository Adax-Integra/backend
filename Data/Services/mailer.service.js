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
        `[mailer] SMTP not configured. Password recovery email for ${email} was not sent.`
      );
      return;
    }

    const resetLink = `https://adax-integra.duckdns.org/reset-password?token=${recoveryToken}`;

    //send the email with the recovery token
    await transporter.sendMail({
      from: MAIL_FROM ?? MAIL_USER,
      to: email,
      subject: 'Recuperación de contraseña de Adax Integra',
      text:
        'Se solicitó la recuperación de tu contraseña en Adax.\n\n' +
        `Tu enlace de recuperación es: \n${resetLink}\n\n` +
        'Este código tiene una vigencia limitada. Si no solicitaste la recuperación de tu contraseña, ignora este correo.',
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
