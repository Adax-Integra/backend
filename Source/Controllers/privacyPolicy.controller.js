import GetLatestPrivacyPolicyUseCase from '../../Domain/UseCases/getLatestPrivacyPolicy.usecase.js';
import RegisterPrivacyConsentUseCase from '../../Domain/UseCases/registerPrivacyConsent.usecase.js';
import PrivacyPolicyDTO from '../DTOs/privacyPolicy.dto.js';

const getLatestPrivacyPolicyUseCase = new GetLatestPrivacyPolicyUseCase();
const registerPrivacyConsentUseCase = new RegisterPrivacyConsentUseCase();

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

  async registerConsent(req, res) {
    try {
      const consent = await registerPrivacyConsentUseCase.execute(
        req.body,
        req.ip
      );

      return res.status(201).json({
        success: true,
        data: {
          consentId: consent.consent_id,
          version: consent.version,
          acceptedAt: consent.accepted_at,
        },
      });
    } catch (error) {
      //Keep database details in server logs instead of exposing them.
      console.error('Failed to register the privacy policy consent:', error);

      const status = error.status ?? 500;

      return res.status(status).json({
        success: false,
        error:
          status === 500 ? 'Unable to register the consent.' : error.message,
      });
    }
  }
}

export default new PrivacyPolicyController();
