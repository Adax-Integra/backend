import { supabase } from '../Config/supabase.js';

const EXTERNAL_PROFILE_COLUMNS = `
  user_id,
  name,
  last_name,
  email,
  birth_date,
  phone
`;

// Data Model for external-user access to the "user" table.
class ExternalUserModel {
  static async findProfileById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select(EXTERNAL_PROFILE_COLUMNS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('User profile not found.');
    }

    return data;
  }

  static async updateProfile(userId, payload) {
    const { data, error } = await supabase
      .from('user')
      .update(payload)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select(EXTERNAL_PROFILE_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default ExternalUserModel;
