import GetLatestPrivacyPolicyUseCase from '../../Domain/UseCases/getLatestPrivacyPolicy.usecase.js';
import PrivacyPolicyDTO from '../DTOs/privacyPolicy.dto.js';

const getLatestPrivacyPolicyUseCase = new GetLatestPrivacyPolicyUseCase();

class PrivacyPolicyController {
  async getLatest(_req, res) {
    try {
      const policy = await getLatestPrivacyPolicyUseCase.execute();
      const payload = new PrivacyPolicyDTO(policy).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      //Keep database details in server logs instead of exposing them.
      console.error('Failed to retrieve the latest privacy policy:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve the privacy policy.',
      });
    }
  }
}

export default new PrivacyPolicyController();
