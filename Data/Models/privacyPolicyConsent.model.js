import { supabase } from '../Config/supabase.js';

/**
 * Data Model for the "privacy_policy_consent" table
 *
 * Holds the evidence that a user accepted a specific version of the notice.
 */
class PrivacyPolicyConsentModel {
  // Returns the user´s acceptance of a notice, or null if there is none.
  static async findAccepted(userId, policyId) {
    const { data, error } = await supabase
      .from('privacy_policy_consent')
      .select('consent_id, version, accepted_at')
      .eq('user_id', userId)
      .eq('policy_id', policyId)
      .eq('is_accepted', true)
      .is('deleted_at', null)
      // No unique constraint protects this table, so duplicates are possible
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // accepted_at, created_at and updated_at are left to the database defaults.
  static async create({ userId, policyId, version, ipAddress }) {
    const { data, error } = await supabase
      .from('privacy_policy_consent')
      .insert({
        user_id: userId,
        policy_id: policyId,
        version,
        is_accepted: true,
        ip_address: ipAddress,
      })
      .select('consent_id, version, accepted_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default PrivacyPolicyConsentModel;
