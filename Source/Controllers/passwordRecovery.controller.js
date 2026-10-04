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
}

export default new PasswordRecoveryController();
