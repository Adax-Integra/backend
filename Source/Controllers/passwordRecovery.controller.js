import PasswordRecoveryUsecase from '../../Domain/UseCases/passwordRecovery.usecase.js';

const passwordRecoveryUsecase = new PasswordRecoveryUsecase();

class PasswordRecoveryController {
  async forgotPassword(req, res) {
    try {
      const { email } = req.body || {};
      const data = await passwordRecoveryUsecase.forgotPassword(email);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      if (error.status < 500) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'No se pudo procesar la recuperación de contraseña.',
      });
    }
  }

  async validateCode(req, res) {
    try {
      const { email, code } = req.body || {};
      const data = await passwordRecoveryUsecase.validateCode(email, code);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status < 500) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'No se pudo procesar la recuperación de contraseña.',
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body || {};
      const data = await passwordRecoveryUsecase.resetPassword(
        email,
        code,
        newPassword
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      if (error.status < 500) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'No se pudo procesar la recuperación de contraseña.',
      });
    }
  }
}

export default new PasswordRecoveryController();
