import { supabase } from '../Config/supabase.js';

//retrieve columns from password recovery table
const PASSWORD_RECOVERY_COLUMNS = `
    recovery_id,
    user_id,
    token_hash,
    expires_at,
    used_at,
    created_at
`;

class PasswordRecoveryModel {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('password_recovery')
      .select(PASSWORD_RECOVERY_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  //add a record if not existing for the user
  static async createRecoveryRecord(userId, tokenHash, expiresAt) {
    const { data, error } = await supabase
      .from('password_recovery')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select(PASSWORD_RECOVERY_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  //if record exists for user, update it instead of creating a new one
  static async updateRecoveryRecord(recoveryId, tokenHash, expiresAt) {
    const { data, error } = await supabase
      .from('password_recovery')
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt,
        used_at: null, //new token has not been used yet
      })
      .eq('recovery_id', recoveryId)
      .select(PASSWORD_RECOVERY_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  //find record by taking raw token and hashing it to compare with stored hash
  static async findByToken(tokenHash) {
    const { data, error } = await supabase
      .from('password_recovery')
      .select(PASSWORD_RECOVERY_COLUMNS)
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  //once token has been used, update table
  static async markTokenAsUsed(recoveryId) {
    const { data, error } = await supabase
      .from('password_recovery')
      .update({
        used_at: new Date().toISOString(),
      })
      .eq('recovery_id', recoveryId)
      .select(PASSWORD_RECOVERY_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}

export default PasswordRecoveryModel;
