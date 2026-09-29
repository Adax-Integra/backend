import GetLatestPrivacyPolicyUseCase from '../../Domain/UseCases/getLatestPrivacyPolicy.usecase.js';
import RegisterPrivacyConsentUseCase from '../../Domain/UseCases/registerPrivacyConsent.usecase.js';
import PrivacyPolicyDTO from '../DTOs/privacyPolicy.dto.js';
import CheckPrivacyConsentUseCase from '../../Domain/UseCases/checkPrivacyConsent.usecase.js';
import RegisterPrivacyConsentDTO from '../DTOs/registerPrivacyConsent.dto.js';
import CheckPrivacyConsentDTO from '../DTOs/checkPrivacyConsent.dto.js';

const getLatestPrivacyPolicyUseCase = new GetLatestPrivacyPolicyUseCase();
const registerPrivacyConsentUseCase = new RegisterPrivacyConsentUseCase();
const checkPrivacyConsentUseCase = new CheckPrivacyConsentUseCase();

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
        req.user.user_id,
        req.body,
        req.ip
      );
      const payload = new RegisterPrivacyConsentDTO(consent).toJSON();

      return res.status(201).json({
        success: true,
        data: payload,
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

  async getConsentStatus(req, res) {
    try {
      const consentStatus = await checkPrivacyConsentUseCase.execute(
        req.user.user_id
      );
      const payload = new CheckPrivacyConsentDTO(consentStatus).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      //Keep database details in server logs instead of exposing them.
      console.error('Failed to check the privacy policy consent:', error);

      const status = error.status ?? 500;

      return res.status(status).json({
        success: false,
        error:
          status === 500
            ? 'Unable to check the consent status.'
            : error.message,
      });
    }
  }
}

export default new PrivacyPolicyController();
