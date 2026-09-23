import { supabase } from '../Config/supabase.js';

const DOCUMENT_COLUMNS = `
  document_id,
  identity_document,
  proof_of_address
`;

const USER_DOCUMENTS_BUCKET = 'user-documents';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 15;
const SIGNED_URL_FIELDS = ['identity_document', 'proof_of_address'];

/**
 * Data Model for external user access to the "user_documents" table.
 *
 * Files live in the "user-documents" Storage bucket.
 * The table stores path strings. attachSignedUrls adds short-lived
 * read URLs for API responses and does not write them.
 */
class ExternalUserDocumentsModel {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_documents')
      .select(DOCUMENT_COLUMNS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async updateByUserId(userId, payload) {
    const { data, error } = await supabase
      .from('user_documents')
      .update(payload)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select(DOCUMENT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('User documents not found.');
    }

    return data;
  }

  // Attach signed URLs to the documents to be returned to the client
  static async attachSignedUrls(documents) {
    if (!documents) {
      return null;
    }

    // Get the paths of the documents to attach signed URLs to
    const paths = SIGNED_URL_FIELDS.map((field) => documents[field]).filter(
      (path) => typeof path === 'string' && path.length > 0
    );

    // Create a map of paths to signed URLs
    const urlsByPath = new Map();

    // Create signed URLs for the documents
    if (paths.length > 0) {
      const { data, error } = await supabase.storage
        .from(USER_DOCUMENTS_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_EXPIRES_IN_SECONDS);

      if (error) {
        throw new Error(error.message);
      }

      // Add the signed URLs to the map
      for (const [index, item] of (data ?? []).entries()) {
        const path = paths[index];
        if (!path) {
          // Skip if the path is not valid
          continue;
        }

        const signedUrl = item.signedUrl ?? item.signedURL ?? null;
        urlsByPath.set(path, item.error ? null : signedUrl);
      }
    }

    // Return the documents with the signed URLs
    return {
      ...documents,
      identity_document_url:
        urlsByPath.get(documents.identity_document) ?? null,
      proof_of_address_url: urlsByPath.get(documents.proof_of_address) ?? null,
    };
  }
}

export default ExternalUserDocumentsModel;
