import PrivacyConsentValidator from '../../Data/Validators/privacyConsent.validator.js';
import PrivacyPolicyModel from '../../Data/Models/privacyPolicy.model.js';
import PrivacyPolicyConsentModel from '../../Data/Models/privacyPolicyConsent.model.js';

/**
 * Tells whether a user has already accepted the notice currently in force.
 *
 * The app calls this on start-up to decide whether to show the privacy screen.
 */
class CheckPrivacyConsentUseCase {
  async execute(userId) {
    const validUserId = PrivacyConsentValidator.validateUserId(userId);
    const policy = await PrivacyPolicyModel.findLatest();

    const consent = await PrivacyPolicyConsentModel.findAccepted(
      validUserId,
      policy.policy_id
    );

    return {
      has_accepted: consent !== null,
      policy_id: policy.policy_id,
      version: policy.version,
      accepted_at: consent?.accepted_at ?? null,
    };
  }
}

export default CheckPrivacyConsentUseCase;
