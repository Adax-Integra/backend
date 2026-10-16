import { supabase } from '../Config/supabase.js';

class CaseViolenceModel {
  static async findActiveByCaseId(caseId) {
    const { data: caseData, error: caseError } = await supabase
      .from('case')
      .select('case_id')
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (caseError) {
      throw new Error(caseError.message);
    }

    if (!caseData) {
      const error = new Error('Case not found.');
      error.status = 404;
      throw error;
    }

    const { data, error } = await supabase
      .from('case_violence')
      .select(
        'violence_id, violence_types!inner(violence_id, description, severity, deleted_at)'
      )
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .is('violence_types.deleted_at', null);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({
      violenceId: item.violence_types.violence_id,
      description: item.violence_types.description,
      severity: item.violence_types.severity,
    }));
  }
  static async replaceForCase(caseId, violenceIds) {
    // Verify that the case exists and is active.
    const { data: caseData, error: caseError } = await supabase
      .from('case')
      .select('case_id')
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (caseError) {
      throw new Error(caseError.message);
    }

    if (!caseData) {
      const error = new Error('Case not found.');
      error.status = 404;
      throw error;
    }

    // Verify that all selected violence types are active.
    if (violenceIds.length > 0) {
      const { data: types, error: typesError } = await supabase
        .from('violence_types')
        .select('violence_id')
        .in('violence_id', violenceIds)
        .is('deleted_at', null);

      if (typesError) {
        throw new Error(typesError.message);
      }

      if (types?.length !== violenceIds.length) {
        const error = new Error('Unknown or inactive violence type.');
        error.status = 400;
        throw error;
      }
    }

    // Read existing assignments, including soft-deleted ones.
    const { data: current, error: currentError } = await supabase
      .from('case_violence')
      .select('violence_id, deleted_at')
      .eq('case_id', caseId);

    if (currentError) {
      throw new Error(currentError.message);
    }

    const existing = current ?? [];
    const selected = new Set(violenceIds);

    const existingById = new Map(
      existing.map((item) => [item.violence_id, item.deleted_at])
    );

    const toActivate = violenceIds.filter(
      (id) => !existingById.has(id) || existingById.get(id) !== null
    );

    const toDisable = existing
      .filter(
        (item) => item.deleted_at === null && !selected.has(item.violence_id)
      )
      .map((item) => item.violence_id);

    // Insert or reactivate selected associations.
    if (toActivate.length > 0) {
      const { error } = await supabase.from('case_violence').upsert(
        toActivate.map((violenceId) => ({
          case_id: caseId,
          violence_id: violenceId,
          deleted_at: null,
        })),
        { onConflict: 'case_id,violence_id' }
      );

      if (error) {
        throw new Error(error.message);
      }
    }

    // Soft-delete associations removed from the selection.
    if (toDisable.length > 0) {
      const { error } = await supabase
        .from('case_violence')
        .update({ deleted_at: new Date().toISOString() })
        .eq('case_id', caseId)
        .in('violence_id', toDisable)
        .is('deleted_at', null);

      if (error) {
        throw new Error(error.message);
      }
    }

    return {
      caseId,
      violenceIds,
    };
  }
}

export default CaseViolenceModel;
