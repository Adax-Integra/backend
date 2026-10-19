import { supabase } from '../Config/supabase.js';
import { calculateCaseUrgency } from '../Services/caseUrgency.helper.js';

// Retrieves card information while keeping cases without assignments.
const CASE_COLUMNS = `
  case_id,
  case_number,
  record_id,
  state,
  created_at,
  updated_at,
  record!inner (
    record_id,
    record_number,
    user!inner (
      user_id,
      name,
      last_name
    )
  ),
  case_violence (
    violence_id,
    violence_types!inner (
      violence_id,
      description,
      severity
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
`;

//retrieval of data for when an external user checks progress of case (V-07)
// besides,  additional info is retrieved like written_description and
//  has_lawyer for case (V-11)

const CASE_DETAIL_COLUMNS = `
  case_id,
  case_number,
  written_description,
  written_helps_wanted,
  has_lawyer,
  state,
  record_id,
  created_at,
  updated_at,
  record!inner (
    record_id,
    record_number,
    user!inner (
      user_id,
      name,
      last_name
    )
  ),
  case_steps (
    case_step_id,
    step_number,
    status
  ),
  case_violence (
    violence_types!inner (
      violence_id,
      description,
      severity
    )
  ),
  case_help (
    help_types!inner (
      help_id,
      description
    )
  )
`;

//  Maximum number of assigned cases returned for a internal user only for US G-10
const ASSIGNED_CASE_COLUMNS = `
  case_id,
  case_number,
  state,
  updated_at,
  record!inner (
    record_id,
    user!inner (
      user_id,
      name,
      last_name
    )
  ),
  case_violence (
    violence_types!inner (
      description
    )
  ),
  case_assignment!inner (
    user_id
  )
`;

//  Maximum number of assigned cases returned for a internal user only for US G-10
const MAX_ASSIGNED_CASES = 100;

// V-12: Same card columns as CASE_COLUMNS plus a second join with an alias.
// Filtering on case_assignment directly would also trim the list of assigned
// interns, so my_assignment only filters and case_assignment keeps every name
const MY_ASSIGNED_CASE_COLUMNS = `
  ${CASE_COLUMNS},
  my_assignment:case_assignment!inner (
    user_id,
    deleted_at
  )
`;

// Data access for case listings. Urgency calculation and ordering are pending.
class CaseModel {
  // Extract page and limit from the input object; their defaults are 1 and 20.
  // The = {} default allows calling findAll() without arguments.
  static async findAll({ page = 1, limit = 20 } = {}) {
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new Error('page must be a positive integer.');
    }

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer between 1 and 100.');
    }

    // Calculate the zero-based positions of this page within the listing.
    // Example: page 2 with a limit of 20 covers positions 20 through 39.
    const from = (page - 1) * limit;
    // range() includes the end position, so subtract 1.
    const to = from + limit - 1;

    // Prevent querying positions beyond JavaScript's safe integer precision,
    // even if page and limit were safe integers before multiplication.
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
      throw new Error('Requested page is out of range.');
    }

    // Await the response and extract the rows (data), error, and total (count).
    const { data, error, count } = await supabase
      .from('case')
      .select(CASE_COLUMNS, { count: 'exact' })
      .is('deleted_at', null)
      .is('record.deleted_at', null)
      .is('record.user.deleted_at', null)
      .is('case_violence.deleted_at', null)
      .is('case_violence.violence_types.deleted_at', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('case_id', { ascending: true })
      .range(from, to);

    // If Supabase reports an error, propagate it instead of returning an empty listing.
    if (error) {
      throw new Error(error.message);
    }

    // Return the listing together with pagination information.
    return {
      // Rows on this page; fall back to an empty array if no data was returned.
      cases: data ?? [],
      // Total cases matching the filters across all pages.
      total: count ?? 0,
      // Requested page and maximum number of cases per page.
      page,
      limit,
    };
  }

  // G-10: Gets the cases assigned to one internal user
  static async findAllByAssignedUser(userId) {
    const { data, error } = await supabase
      .from('case')
      .select(ASSIGNED_CASE_COLUMNS)
      // Only the cases assigned to this collaborator
      .eq('case_assignment.user_id', userId)
      // Ignores assignments that were removed
      .is('case_assignment.deleted_at', null)
      .is('deleted_at', null)
      .is('record.deleted_at', null)
      .is('record.user.deleted_at', null)
      .is('case_violence.deleted_at', null)
      .is('case_violence.violence_types.deleted_at', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('case_id', { ascending: true })
      .limit(MAX_ASSIGNED_CASES);

    if (error) {
      throw new Error(error.message);
    }

    const cases = data ?? [];

    return {
      cases,
      total: cases.length,
    };
  }

  // V-12: One page of the cases assigned to the logged-in collaborator,
  // open and closed. The use case reads every page before sorting by severity
  static async findPageByAssignedUser(userId, { page = 1, limit = 100 } = {}) {
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new Error('page must be a positive integer.');
    }

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be a positive integer between 1 and 100.');
    }

    // range() includes the end position, so subtract 1
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('case')
      .select(MY_ASSIGNED_CASE_COLUMNS, { count: 'exact' })
      // Only the cases where this collaborator has an active assignment
      .eq('my_assignment.user_id', userId)
      .is('my_assignment.deleted_at', null)
      .is('deleted_at', null)
      .is('record.deleted_at', null)
      .is('record.user.deleted_at', null)
      .is('case_violence.deleted_at', null)
      .is('case_violence.violence_types.deleted_at', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('case_id', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      cases: data ?? [],
      total: count ?? 0,
    };
  }

  /*
  R-10: Assigns several internals or admins to a case in a single upsert,
  so either every assignment is saved or none is.
  */
  static async assignUsers(caseId, userIds) {
    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from('case_assignment').upsert(
      userIds.map((userId) => ({
        case_id: caseId,
        user_id: userId,
        deleted_at: null,
        updated_at: updatedAt,
      })),
      { onConflict: 'case_id,user_id' }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  //case will be retrieved by caseId to display correct information of progress to external user (V-07)
  static async findById(caseId) {
    const { data, error } = await supabase
      .from('case')
      .select(CASE_DETAIL_COLUMNS)
      .eq('case_id', caseId)
      .is('deleted_at', null)
      .is('record.deleted_at', null)
      .is('record.user.deleted_at', null)
      .is('case_steps.deleted_at', null)
      .is('case_violence.deleted_at', null)
      .is('case_violence.violence_types.deleted_at', null)
      // R-08: Helps remove form the case are soft deleted
      .is('case_help.deleted_at', null)
      //order the steps to show progress correctly
      .order('step_number', {
        foreignTable: 'case_steps',
        ascending: true,
      })
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    //missing case situation
    if (!data) {
      throw new Error(`Case with ID ${caseId} not found.`);
    }

    return data;
  }

  // Closes a case atomically so that it only updates if it is not already Closed for V-11 cancel button

  static async closeCase(caseId) {
    const { data, error } = await supabase
      .from('case')
      .update({ state: 'Closed' })
      .eq('case_id', caseId)
      .neq('state', 'Closed')
      .is('deleted_at', null)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  //Creates a case with its help type and its three steps
  static async create({
    recordId,
    writtenDescription,
    writtenHelpsWanted,
    hasLawyer,
    state,
    stepStatus,
  }) {
    const { data, error } = await supabase.rpc('create_case', {
      p_record_id: recordId,
      p_written_description: writtenDescription,
      p_written_helps_wanted: writtenHelpsWanted,
      p_has_lawyer: hasLawyer,
      p_state: state,
      p_step_status: stepStatus,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('The case could not be created');
    }

    return data;
  }

  //Counts the non-deleted, non-closed cases of a record this used
  // to stop a user or a script from stacking many open cases
  static async countActiveByRecordId(recordId) {
    const { count, error } = await supabase
      .from('case')
      .select('case_id', { count: 'exact', head: true })
      .eq('record_id', recordId)
      .is('deleted_at', null)
      .neq('state', 'Closed');

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }
  // Retrieves active violence types for R-07
  static async getActiveViolenceTypes() {
    const { data, error } = await supabase
      .from('violence_types')
      .select('violence_id, description, severity')
      .is('deleted_at', null)
      .order('description', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
  // Assigns the selected violence types to a case (R-07)
  static async assignViolenceTypes(caseId, violenceIds) {
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
      error.code = 'CASE_NOT_FOUND';
      throw error;
    }

    // A closed case can not be edited
    if (caseData.state === 'Closed') {
      const error = new Error('Case with ID ${caseId} is closed');
      error.status = 409;
      error.code = 'CASE_CLOSED';
      throw error;
    }

    let selectedTypes = [];

    if (violenceIds.length > 0) {
      const { data: types, error: typesError } = await supabase
        .from('violence_types')
        .select('violence_id, severity')
        .in('violence_id', violenceIds)
        .is('deleted_at', null);

      if (typesError) {
        throw new Error(typesError.message);
      }

      if (types?.length !== violenceIds.length) {
        const error = new Error('Unknown or inactive violence type.');
        error.status = 400;
        error.code = 'INVALID_VIOLENCE_TYPE';
        throw error;
      }

      selectedTypes = types;
    }

    const { data: current, error: currentError } = await supabase
      .from('case_violence')
      .select('violence_id, deleted_at')
      .eq('case_id', caseId);

    if (currentError) {
      throw new Error(currentError.message);
    }

    const selected = new Set(violenceIds);
    const existing = current ?? [];
    const existingById = new Map(
      existing.map((item) => [item.violence_id, item.deleted_at])
    );

    const now = new Date().toISOString();

    const changes = [
      ...violenceIds
        .filter((id) => !existingById.has(id) || existingById.get(id) !== null)
        .map((violenceId) => ({
          case_id: caseId,
          violence_id: violenceId,
          deleted_at: null,
          updated_at: now,
        })),
      ...existing
        .filter(
          (item) => item.deleted_at === null && !selected.has(item.violence_id)
        )
        .map((item) => ({
          case_id: caseId,
          violence_id: item.violence_id,
          deleted_at: now,
          updated_at: now,
        })),
    ];

    if (changes.length > 0) {
      const { error } = await supabase
        .from('case_violence')
        .upsert(changes, { onConflict: 'case_id,violence_id' });

      if (error) {
        throw new Error(error.message);
      }
    }
    const { severity, urgency } = calculateCaseUrgency(
      selectedTypes.map((type) => ({
        violence_types: { severity: type.severity },
      }))
    );

    return { caseId, violenceIds, severity, urgency };
  }

  //r-13 update case step
  static async updateCaseStep(caseId, targetStepNumber) {
    //fetch all steps for this case to check bounds
    const { data: steps, error: stepsError } = await supabase
      .from('case_steps')
      .select('case_step_id, step_number')
      .eq('case_id', caseId)
      .is('deleted_at', null);

    if (stepsError) {
      throw new Error(stepsError.message);
    }

    if (!steps || steps.length === 0) {
      const error = new Error('No steps found for this case.');
      error.status = 404;
      throw error;
    }

    const stepExists = steps.some((s) => s.step_number === targetStepNumber);
    if (!stepExists) {
      const error = new Error('Invalid step number for this case.');
      error.status = 400;
      throw error;
    }

    //if the later steps are marked pendiente, previous steps will
    //automatically mark as completado
    const now = new Date().toISOString();
    const updatePromises = steps.map(async (step) => {
      const newStatus =
        step.step_number <= targetStepNumber ? 'Completado' : 'Pendiente';
      return supabase
        .from('case_steps')
        .update({ status: newStatus, updated_at: now })
        .eq('case_step_id', step.case_step_id);
    });

    await Promise.all(updatePromises);

    return await this.findById(caseId);
  }
}

export default CaseModel;
