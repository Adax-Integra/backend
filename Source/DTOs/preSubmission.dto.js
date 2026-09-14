class PreSubmissionDTO {
  constructor({ profile, address, documents }) {
    this.profile = profile ?? null;
    this.address = address ?? null;
    this.documents = documents ?? null;
  }

  toJSON() {
    return {
      profile: this.profile,
      address: this.address,
      documents: this.documents,
    };
  }
}

export default PreSubmissionDTO;
