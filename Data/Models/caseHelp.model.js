import { supabase } from '../Config/supabase.js';

// R-08: Data access for the help types catalog and the helps assigned to a case

class CaseHelpModel {
  // Active help types, in the order they were registered

  static async findAllHelpTypes() {
    const { data, error } = await supabase
      .from('help_types')
      .select('help_id, description')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .order('help_id', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  // Only returns the ids that exist in the active catalog

  static async findHelpTypesByIds(helpIds) {
    if (helpIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('help_types')
      .select('help_id')
      .in('help_id', helpIds)
      .is('deleted_at', null);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  // Minimal case info to know if it exists and if it is closed

  static async findCaseById(caseId) {
    const { data, error } = await supabase
      .from('case')
      .select('case_id, state')
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /*
Replaces the helps of a case with the given list.
New helps are inserted and removed ones are restored with deleted_at = null,
the composite primary key (case_id, help_id) does not allow a second row.
Helps that are not in the list are soft deleted.
Sending the same list again gives the same result, so a failed request can be retried
  */

  static async replaceForCase(caseId, helpIds) {
    if (helpIds.length > 0) {
      const rows = helpIds.map((helpId) => ({
        case_id: caseId,
        help_id: helpId,
        deleted_at: null,
      }));

      const { error: upsertError } = await supabase
        .from('case_help')
        .upsert(rows, { onConflict: 'case_id,help_id' });

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    let removeQuery = supabase
      .from('case_help')
      .update({ deleted_at: new Date().toISOString() })
      .eq('case_id', caseId)
      .is('deleted_at', null);

    if (helpIds.length > 0) {
      removeQuery = removeQuery.not('help_id', 'in', `(${helpIds.join(',')})`);
    }

    const { error: removeError } = await removeQuery;

    if (removeError) {
      throw new Error(removeError.message);
    }
  }

  // Active helps of a case with their description

  static async findActiveByCaseId(caseId) {
    const { data, error } = await supabase
      .from('case_help')
      .select(
        `
        help_types!inner (
        help_id,
        description
        )
    `
      )
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .is('help_types.deleted_at', null);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => row.help_types);
  }
}

export default CaseHelpModel;
