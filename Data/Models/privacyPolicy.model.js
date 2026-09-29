import { supabase } from '../Config/supabase.js';

const PRIVACY_POLICY_BUCKET = 'privacy-policy';

/**
 * Data model for the "privacy_policy" catalogue table.
 *
 * The notice is a PDF that lives in the "privacy-policy" storage bucket.
 * This model only reads the path string.
 */
class PrivacyPolicyModel {
  static async findLatest() {
    const { data, error } = await supabase
      .from('privacy_policy')
      .select('*')
      .is('deleted_at', null)
      // version is a varchar: "1.10" would sort before "1.9"
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

  static async findById(policyId) {
    const { data, error } = await supabase
      .from('privacy_policy')
      .select('*')
      .eq('policy_id', policyId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

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
