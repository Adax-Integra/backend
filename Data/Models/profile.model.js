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
      .from('user')
      .select(PROFILE_COLUMNS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    //missing userId situation
    if (!data) {
      // G-13 always answers 400, the status is used by GET /profile/:userId/edit (r-04)
      const notFound = new Error(`User with ID ${userId} not found.`);
      notFound.status = 404;
      throw notFound;
    }
    return data;
  }

  /* 
  R-04: Admin and internal users only edit their user row, 
  they have no address unlike external users
  */
  static async updateProfileById(userId, payload) {
    const { data, error } = await supabase
      .from('user')
      .update(payload)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('user_id')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default ProfileModel;
