/**
 * Output shape for the privacy notice in force (V-02)
 *
 * policyId and version are the values the client sends back when the user
 * accepts, so the consent record points at the exact notice she read.
 */
class PrivacyPolicyDTO {
  constructor({ policy_id, version, document_url } = {}) {
    this.policyId = policy_id ?? null;
    this.version = version ?? null;
    this.documentUrl = document_url ?? null;
  }

  toJSON() {
    return {
      policyId: this.policyId,
      version: this.version,
      documentUrl: this.documentUrl,
    };
  }
}

export default PrivacyPolicyDTO;
