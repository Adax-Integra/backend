import PrivacyConsentValidator from '../../Data/Validators/privacyConsent.validator.js';
import PrivacyPolicyModel from '../../Data/Models/privacyPolicy.model.js';
import PrivacyPolicyConsentModel from '../../Data/Models/privacyPolicyConsent.model.js';

function requestError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

/**
 * Records that a user accepted a privacy notice.
 *
 * The version is read from the catalogue instead of the request, so the
 * stored evidence always matches a notice that really exists.
 */
class RegisterPrivacyConsentUseCase {
  async execute(body, ipAddress) {
    const { userId, policyId } = PrivacyConsentValidator.validateBody(body);

    if (!ipAddress) {
      throw requestError('Could not determine the client IP address.');
    }

    const policy = await PrivacyPolicyModel.findById(policyId);
    if (!policy) {
      throw requestError('The privacy policy was not found.');
    }

    // Accepting twice is not an error: the client may simply be retrying.
    const existing = await PrivacyPolicyConsentModel.findAccepted(
      userId,
      policyId
    );
    if (existing) {
      return existing;
    }

    return PrivacyPolicyConsentModel.create({
      userId,
      policyId,
      version: policy.version,
      ipAddress,
    });
  }
}

export default RegisterPrivacyConsentUseCase;
