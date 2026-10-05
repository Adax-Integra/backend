import { supabase } from '../Config/supabase.js';

// V-06 shows 10 entries per page, the same size as the records listing in V-05
const PAGE_SIZE = 10;

// The name of who did the action comes from the user table through
const ACTIVITY_LOG_COLUMNS = `
  log_id,
  action,
  details,
  created_at,
  actor:user!activity_log_actor_user_id_fkey (
    name,
    last_name
  )
`;

// Data Model for the activity_log.
// Entries are written by other features, V-06 only reads them.
class ActivityLogModel {
  static async findAll({ page = 1, from = null, to = null } = {}) {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from('activity_log')
      .select(ACTIVITY_LOG_COLUMNS, { count: 'exact' });

    // Filters are applied in the database before counting and paginating
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    const { data, error, count } = await query
      // Newest entries first, log_id keeps a stable order
      .order('created_at', { ascending: false })
      .order('log_id', { ascending: true })
      .range(start, end);

    if (error) {
      // PGRST103: the page is after the last entry, so it is an empty page
      if (error.code === 'PGRST103') {
        return { logs: [], total: count ?? 0, page, limit: PAGE_SIZE };
      }
      throw new Error(error.message);
    }

    return {
      logs: data ?? [],
      total: count ?? 0,
      page,
      limit: PAGE_SIZE,
    };
  }
}

export default ActivityLogModel;
