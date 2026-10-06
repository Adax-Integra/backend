/**
 * Output shape for the consent check the app runs on start-up (V-02)
 *
 * policyId and version describe the notice the answer refers to, so the
 * client can tell a new version was published.
 */
class CheckPrivacyConsentDTO {
  constructor({ has_accepted, policy_id, version, accepted_at } = {}) {
    this.hasAccepted = Boolean(has_accepted);
    this.policyId = policy_id ?? null;
    this.version = version ?? null;
    this.acceptedAt = accepted_at ?? null;
  }

  toJSON() {
    return {
      hasAccepted: this.hasAccepted,
      policyId: this.policyId,
      version: this.version,
      acceptedAt: this.acceptedAt,
    };
  }
}

export default CheckPrivacyConsentDTO;
