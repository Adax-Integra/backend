import { supabase } from '../Config/supabase.js';

const RECORD_COLUMNS = `
    record_id,
    user_id,
    created_at
`;

const RECORD_LIST_COLUMNS = `
  record_id,
  user_id,
  name,
  active_cases_count,
  updated_at
`;

//Data model dor the "record" table
//A case belongs to a record not directly to a user
class RecordModel {
  static async findActiveByUserId(userId) {
    const { data, error } = await supabase
      .from('record')
      .select(RECORD_COLUMNS)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    //R-02 is only available after R01, so a missing record means the "expediente"
    // was never created rather than a malformed request
    if (!data) {
      const notFound = new Error('Record not found for this user');
      notFound.status = 404;
      throw notFound;
    }

    return data;
  }

  //Retrieves a page of non-deleted records and their owners.
  static async findAll({ page = 1, search = '', hasOpenCases = null } = {}) {
    // V-05 displays 10 records per page
    const limit = 10;

    if (!Number.isSafeInteger(page) || page < 1) {
      throw new Error('page must be a positive integer.');
    }

    if (typeof search !== 'string') {
      throw new Error('search must be a text value.');
    }

    // null means no filter; false selects records without open cases.
    if (hasOpenCases !== null && typeof hasOpenCases !== 'boolean') {
      throw new Error('hasOpenCases must be a boolean or null.');
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Multiplication can exceed safe precision even when page is valid
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
      throw new Error('Request page is out of range.');
    }

    let query = supabase
      .from('record_list')
      .select(RECORD_LIST_COLUMNS, { count: 'exact' });

    const searchText = search.trim();

    if (searchText) {
      // Treat SQL wildcard characters as literal search text.
      const escapedSearch = searchText.replace(/[\\%_]/g, '\\$&');

      query = query.ilike('name', `%${escapedSearch}%`);
    }

    // Apply the filter in the database before counting and paginating.
    if (hasOpenCases === true) {
      query = query.gt('active_cases_count', 0);
    } else if (hasOpenCases === false) {
      query = query.eq('active_cases_count', 0);
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      // Keep a consistent order
      .order('record_id', { ascending: true })
      .range(from, to);

    // If a query fail must not be treated as an empty listing
    if (error) {
      throw new Error(error.message);
    }

    // total counts all matching records, not just the current page
    return {
      records: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }
}

export default RecordModel;
