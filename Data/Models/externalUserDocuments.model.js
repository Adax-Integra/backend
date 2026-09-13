import { supabase } from '../Config/supabase.js';

// Data Model for external-user access to the "user_documents" table.One documents row per user.
class ExternalUserDocumentsModel {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_documents')
      .select(
        `
          document_id,
          identity_document,
          proof_of_address
        `
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default ExternalUserDocumentsModel;
