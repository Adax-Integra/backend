class PreSubmissionDTO {
  constructor({ user_id, profile, address, documents }) {
    this.user_id = user_id ?? null;
    this.profile = profile
      ? {
          name: profile.name,
          last_name: profile.last_name,
          birth_date: profile.birth_date,
          phone: profile.phone,
        }
      : null;
    this.address = address
      ? {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          neighborhood: address.neighborhood,
          zip_code: address.zip_code,
          country: address.country,
          state: address.state,
          city: address.city,
        }
      : null;
    this.documents = documents
      ? {
          document_id: documents.document_id,
          identity_document_url: documents.identity_document_url,
          proof_of_address_url: documents.proof_of_address_url,
        }
      : null;
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
