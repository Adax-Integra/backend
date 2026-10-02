import { supabase } from '../Config/supabase.js';
//Data Model for Supabase Auth accounts (auth.users)
// Supabase Auth stores the password, public.user only stores the profile

class AuthUserModel {
  // Creates the login account in Supabase Auth and returns its id
  static async create(email, password) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      // stops the registration if Supabase could not create the account

      throw new Error(error.message);
    }

    return data.user.id;
    // returns the id of the new auth account
  }

  static async delete(userId) {
    // Deletes the login account when the profile could not be created
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      // // Only log the error
      console.error('[auth-user] Failed to delete auth account:', error);
    }
  }
}
export default AuthUserModel;
