import { supabase } from '../Config/supabase.js';

class AuthTokenModel {
  static TABLE = 'auth_tokens';

  // Stores a new token without replacing other device sessions.
  static async create(userId, tokenHash, expiresAt) {
    const { error } = await supabase.from(AuthTokenModel.TABLE).insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Checks that the token exists, has not expired, and belongs to an active user.
  static async isActive(userId, tokenHash) {
    const { data, error } = await supabase
      .from(AuthTokenModel.TABLE)
      .select('token_hash, user!inner(user_id)')
      .eq('user_id', userId)
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .is('user.deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data !== null;
  }

  // Deletes only this token, keeping other device sessions active.
  static async deleteByHash(userId, tokenHash) {
    const { error } = await supabase
      .from(AuthTokenModel.TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('token_hash', tokenHash);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export default AuthTokenModel;
