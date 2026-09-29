import PrivacyPolicyModel from '../../Data/Models/privacyPolicy.model.js';

/**
 * Return the privacy notice the user must read before giving her consent,
 * with the stored PDF path already resolved into a public URL
 */
class GetLatestPrivacyPolicyUseCase {
  async execute() {
    const policy = await PrivacyPolicyModel.findLatest();

    return {
      ...policy,
      document_url: PrivacyPolicyModel.getDocumentUrl(policy.content),
    };
  }
}

export default GetLatestPrivacyPolicyUseCase;
