/**
 * Output shape for a consent that was just recorded (V-02)
 *
 * The user id and the IP address stay on the server: they are stored as
 * evidence, not something the app needs back.
 */
class RegisterPrivacyConsentDTO {
  constructor({ consent_id, version, accepted_at } = {}) {
    this.consentId = consent_id ?? null;
    this.version = version ?? null;
    this.acceptedAt = accepted_at ?? null;
  }

  toJSON() {
    return {
      consentId: this.consentId,
      version: this.version,
      acceptedAt: this.acceptedAt,
    };
  }
}

export default RegisterPrivacyConsentDTO;
