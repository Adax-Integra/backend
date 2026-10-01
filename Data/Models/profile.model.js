import { supabase } from '../Config/supabase.js';

//retrieve columns from profile table
const PROFILE_COLUMNS = `
    user_id,
    name,
    last_name,
    email,
    birth_date,
    phone,
    created_at
`;

//model to be able to display needed information to users in profile tab (g-13)
class ProfileModel {
  static async getProfileByUserId(userId) {
    const { data, error } = await supabase
      .from('profile')
      .select(PROFILE_COLUMNS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    //missing userId situation
    if (!data) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    return data;
  }
}

export default ProfileModel;
