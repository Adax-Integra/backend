class PreSubmissionDTO {
  constructor({ user_id, profile, address, documents }) {
    this.user_id = user_id ?? null;
    this.profile = profile ?? null;
    this.address = address ?? null;
    this.documents = documents ?? null;
  }

  toJSON() {
    return {
      user_id: this.user_id,
      profile: this.profile,
      address: this.address,
      documents: this.documents,
    };
  }
}

export default PreSubmissionDTO;
