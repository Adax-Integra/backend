import { supabase } from '../Config/supabase.js';
// Import the Supabase connection or configuration (query)

class UserModel {
  static TABLE = 'user';

  static AUTH_COLUMNS = 'user_id, email, password';

  /**
   * Return back the data if the email is found in the database, otherwise returns null.
   * @param  email Email to search for
   *
   **/
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from(UserModel.TABLE)
      .select(UserModel.AUTH_COLUMNS)
      .eq('email', email)
      // Matches the received email
      .is('deleted_at', null)
      // Only if it has not been deleted
      .maybeSingle();
    // Returns a single record or null if it does not exist

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async findById(userId) {
    const { data, error } = await supabase
      .from(UserModel.TABLE)
      .select(UserModel.AUTH_COLUMNS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async updatePassword(userId, passwordHash) {
    const { data, error } = await supabase
      .from(UserModel.TABLE)
      .update({ password: passwordHash })
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

export default UserModel;
