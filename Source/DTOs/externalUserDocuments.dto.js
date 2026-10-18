//V-13: only the signed link and the kind of file are exposed, never the storage path
class ExternalUserDocumentsDTO {
  constructor({ user_id, identity_document = null, proof_of_address = null }) {
    this.user_id = user_id ?? null;
    this.identity_document =
      ExternalUserDocumentsDTO.toDocument(identity_document);
    this.proof_of_address =
      ExternalUserDocumentsDTO.toDocument(proof_of_address);
  }

  static toDocument(document) {
    if (!document) {
      return null;
    }

    return {
      //Link to the backend that expires after 5 minutes (R-06 encryption)
      url: document.url ?? null,
      file_type: document.file_type,
    };
  }

  toJSON() {
    return {
      user_id: this.user_id,
      identity_document: this.identity_document,
      proof_of_address: this.proof_of_address,
    };
  }
}

export default ExternalUserDocumentsDTO;
