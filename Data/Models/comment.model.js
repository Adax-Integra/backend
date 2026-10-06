import { supabase } from '../Config/supabase.js';

// Retrieve comment columns aswell as the author of the comment info
const COMMENT_COLUMNS = `
  comment_id,
  case_id,
  content,
  time_sent,
  user!inner (
    user_id,
    name,
    last_name
  )
`;

class CommentModel {
  // Checks that a case exists and is not deleted
  static async caseExists(caseId) {
    const { data, error } = await supabase
      .from('case')
      .select('case_id')
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data);
  }

  // Saves a comment and returns it with its author's data  for US B-02
  static async create({ caseId, userId, content }) {
    const { data, error } = await supabase
      .from('comment')
      .insert({ case_id: caseId, user_id: userId, content })
      .select(COMMENT_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Lists the current comments but we make the newest ones appear first for US B-02
  static async findByCaseId(caseId, { limit = 50 } = {}) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer between 1 and 100.');
    }

    // Use limit as a safety  to fetch all relevant comments without overwhelming the request
    //  The default is 50 because I dont think there will be more than that many comments  but it can be changed if needed
    const { data, error } = await supabase
      .from('comment')
      .select(COMMENT_COLUMNS)
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .is('user.deleted_at', null)
      .order('time_sent', { ascending: false })
      .order('comment_id', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  // Finds one active comment by id returns null if the id does not exist
  static async findById(commentId) {
    const { data, error } = await supabase
      .from('comment')
      .select(COMMENT_COLUMNS)
      .eq('comment_id', commentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Soft delete that will be used to delete comments but returns null if it was already deleted
  static async softDelete(commentId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('comment')
      .update({ deleted_at: now, updated_at: now })
      .eq('comment_id', commentId)
      .is('deleted_at', null)
      .select('comment_id')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default CommentModel;
