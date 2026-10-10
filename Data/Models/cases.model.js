import { supabase } from '../Config/supabase.js';

class CasesModel {
  /**
   * Fetches all active cases from a user ID
   * Expects a clean userId
   * Returns an object array
   */
  static async getAllCasesFromUser(userId) {
    const { data: records, error: recordsError } = await supabase
      .from('record')
      .select('record_id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (recordsError) {
      throw new Error(recordsError.message);
    }

    const recordIds = (records ?? []).map(({ record_id }) => record_id);

    if (recordIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('case')
      .select(
        `
        case_id,
        case_number,
        state,
        updated_at,
        record (
          user (
            name,
            last_name
          )
        ),
        case_violence (
          deleted_at,
          violence_types (
            description,
            deleted_at
          )
        ),
        case_assignment (
          deleted_at,
          user (
            user_id,
            name,
            last_name,
            deleted_at
          )
        )
      `
      )
      .is('deleted_at', null)
      .in('record_id', recordIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default CasesModel;
