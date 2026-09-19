import { supabase } from '../data/config/supabase.js';

// keeps cases that do not have any active violence types yet.
const CASE_COLUMNS = `
  case_id,
  record_id,
  state,
  created_at,
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
    violence_id,
    violence_types!inner (
      violence_id,
      description
    )
  )
`;

//retrieval of data for when an external user checks progress of case (V-07)
const CASE_DETAIL_COLUMNS = `
  case_id,
  case_number,
  state,
  record_id,
  record!inner (
    record_id,
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
      //order the steps to show progress correctly
      .order('step_number', {
      foreignTable: 'case_steps',
      ascending: true
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
}

export default CaseModel;
