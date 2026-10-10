import UserUseCase from '../../Domain/UseCases/user.usecase.js';
import ChangePasswordUseCase from '../../Domain/UseCases/changePassword.usecase.js';
import VerifyEmailUseCase from '../../Domain/UseCases/verifyEmail.usecase.js';
import ResendVerificationUseCase from '../../Domain/UseCases/resendVerification.usecase.js';

const verifyEmailUseCase = new VerifyEmailUseCase();
const resendVerificationUseCase = new ResendVerificationUseCase();

// Creates a UserUseCase instance so we can use the login() method in this controller
const userUseCase = new UserUseCase();
const changePasswordUseCase = new ChangePasswordUseCase();

class AuthController {
  // POST /api/auth/login // Method to log in
  async login(req, res) {
    // req:contains the information sent by the client.
    // res: is used to send the response back to the client.
    try {
      const body = req.body || {};
      // Sends the email and password to the UserUseCase.
      const data = await userUseCase.login(body.email, body.password);

      return res.status(200).json({
        // If the login is successful, we respond with HTTP status 200.
        success: true,
        data: data,
      });
    } catch (error) {
      // Expected errors (400 or 401): we explain the problem to the user
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
        // If UserUseCase threw an error that contains an HTTP status code in "error.status", we use that same code to respond
      }

      // console.error('Login failed:', error); // Message shown in the server console

      return res.status(500).json({
        // Something went wrong on the server while trying to log in
        success: false,
        error: 'Unable to log in.',
      });
    }
  }

  async changePassword(req, res) {
    try {
      await changePasswordUseCase.execute(req.user.user_id, req.body);

      return res.status(200).json({
        success: true,
        data: { message: 'Password updated successfully.' },
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
      }

      console.error('Password change failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Unable to change password.',
      });
    }
  }

  // POST /api/auth/verify-email (G-09)
  async verifyEmail(req, res) {
    try {
      const data = await verifyEmailUseCase.execute(req.body);

      return res.status(200).json({ success: true, data });
    } catch (error) {
      // expected errors (validation, wrong code, limits)
      if (!error.status || error.status < 500) {
        return res.status(error.status ?? 400).json({
          success: false,
          code: error.code ?? 'VALIDATION_ERROR',
          error: error.message,
        });
      }

      console.error('Email verification failed: ', error);
      return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Unable to verify email.',
      });
    }
  }

  // POST /api/auth/resend-verification (G-09)
  async resendVerification(req, res) {
    try {
      const data = await resendVerificationUseCase.execute(req.body);

      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (!error.status || error.status < 500) {
        return res.status(error.status ?? 400).json({
          success: false,
          code: error.code ?? 'VALIDATION_ERROR',
          error: error.message,
        });
      }

      console.error('Resend verification failed: ', error);
      return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'Unable to send verification code.',
      });
    }
  }
}

// Creates and exports an AuthController instance
export default new AuthController();
