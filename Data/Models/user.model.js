import { supabase } from '../Config/supabase.js';

const PROFILE_COLUMNS = `
  user_id,
  name,
  last_name,
  email,
  birth_date,
  phone,
  office_id
`;

/**
 * Data Model for the "user" table.
 * Domain use cases call this layer to talk to Supabase.
 */
class UserModel {
  static async findProfileById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select(PROFILE_COLUMNS)
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

  static async updateProfile(userId, updateData) {
    const { data, error } = await supabase
      .from('user')
      .update(updateData)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default UserModel;
