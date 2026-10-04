import UserModel from '../../Data/Models/user.model.js';

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

    //check for alid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      const error = new Error('Favor de ingresar un correo válido.');
      error.status = 400;
      throw error;
    }

    await UserModel.findByEmail(cleanEmail);

    return { message: `Si el correo existe, se envió un enlace` };
  }
}

export default PasswordRecoveryUseCase;
