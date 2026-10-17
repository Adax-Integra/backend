import { supabase } from '../Config/supabase.js';
// Import the Supabase connection or configuration (query)

class UserModel {
  static TABLE = 'user';

  static AUTH_COLUMNS = 'user_id, email, password, email_verified_at';

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
  // G-09: marks the email as verified once the user enters the correct code
  static async markEmailVerified(userId) {
    const { error } = await supabase
      .from(UserModel.TABLE)
      .update({ email_verified_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      throw new Error(error.message);
    }
  }

  // B-01: reads the identity verification status of a user
  static async getVerificationStatus(userId) {
    const { data, error } = await supabase
      .from(UserModel.TABLE)
      .select('user_id, verification_status')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async updateVerificationStatus(userId, status) {
    const { data, error } = await supabase
      .from(UserModel.TABLE)
      .update({ verification_status: status })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('user_id, verification_status')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // G-08: the account is marked with deleted_at instead of being deleted,
  // so the login stops finding it and its records, cases and log entries are kept.
  // Returns null when the account does not exist or was already deactivated
  static async deactivate(userId) {
    const { data, error } = await supabase
      .from(UserModel.TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('user_id, deleted_at')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default UserModel;
