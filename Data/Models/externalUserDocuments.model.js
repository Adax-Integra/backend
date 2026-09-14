import { supabase } from '../Config/supabase.js';

const DOCUMENT_COLUMNS = `
  document_id,
  identity_document,
  proof_of_address
`;

/**
 * Data Model for external user access to the "user_documents" table.
 *
 * Files live in the "user-documents" Storage bucket.
 * This model only stores/reads the path strings.
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
}

export default ExternalUserDocumentsModel;
