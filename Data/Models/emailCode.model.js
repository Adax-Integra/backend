import { supabase } from '../Config/supabase.js';

// Data model for the "email_code" table.
// Stores hashed 6 digit codes for email verification (G-09) and password recovery (G-05).

class EmailCodeModel {
  static TABLE = 'email_code';

  static COLUMNS =
    'user_id, purpose, code_hash, expires_at, attempts, send_count, last_sent_at';

  // Returns the current code for the user and purpose, or null if there is none
  static async find(userId, purpose) {
    const { data, error } = await supabase
      .from(EmailCodeModel.TABLE)
      .select(EmailCodeModel.COLUMNS)
      .eq('user_id', userId)
      .eq('purpose', purpose)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Creates or replaces the code, so each user has at most one active code per purpose
  static async upsert({ userId, purpose, codeHash, expiresAt, sendCount }) {
    const { error } = await supabase.from(EmailCodeModel.TABLE).upsert({
      user_id: userId,
      purpose,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      send_count: sendCount,
      last_sent_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Saves a failed attempt
  static async setAttempts(userId, purpose, attempts) {
    const { error } = await supabase
      .from(EmailCodeModel.TABLE)
      .update({ attempts })
      .eq('user_id', userId)
      .eq('purpose', purpose);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Deletes the code once it has been used
  static async remove(userId, purpose) {
    const { error } = await supabase
      .from(EmailCodeModel.TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('purpose', purpose);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export default EmailCodeModel;
