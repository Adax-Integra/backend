import PasswordRecoveryUsecase from '../../domain/useCases/passwordRecovery.usecase.js';

const passwordRecoveryUsecase = new PasswordRecoveryUsecase();

class PasswordRecoveryController {
  async forgotPassword(req, res) {
    try {
      const body = req.body || {};

      const data = await passwordRecoveryUsecase.forgotPassword(body.email);

      return res.status(200).json({
        success: true,
        data: data,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'No se pudo procesar la recuperación de contraseña.',
      });
    }
  }

  //reset password while validating the token and new password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const result = await passwordRecoveryUsecase.resetPassword(
        token,
        newPassword
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
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
