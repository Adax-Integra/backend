import { supabase } from '../Config/supabase.js';

const POLICY_COLUMNS = `
    policy_id,
    version,
    content
`;
const PRIVACY_POLICY_BUCKET = 'privacy-policy';

/**
 * Data model for the "privacy_policy" catalogue table.
 *
 * The notice is a PDF that lives in the "privacy-policy" storage bucket.
 * This model only stores/reads the path string.
 */
class PrivacyPolicyModel {
  // Returns the newest privacy notice that has not been soft deleted
  static async findLatest() {
    const { data, error } = await supabase
      .from('privacy_policy')
      .select(POLICY_COLUMNS)
      .is('deleted_at', null)
      //version is a varchar: "1.10" would sort before "1.9"
      .order('created_at', { ascending: false })
      .order('policy_id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No active privacy policy found.');
    }

    return data;
  }

  //Builds the public URL for a stored PDF path.
  static getDocumentUrl(path) {
    if (!path || typeof path !== 'string') {
      return null;
    }

    const { data } = supabase.storage
      .from(PRIVACY_POLICY_BUCKET)
      .getPublicUrl(path);

    return data?.publicUrl ?? null;
  }
}

export default PrivacyPolicyModel;
