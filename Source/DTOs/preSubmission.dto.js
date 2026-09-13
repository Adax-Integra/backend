class PreSubmissionDTO {
  constructor({ profile, address }) {
    this.profile = profile ?? null;
    this.address = address ?? null;
  }

  toJSON() {
    return {
      profile: this.profile,
      address: this.address,
    };
  }
}

export default PreSubmissionDTO;
