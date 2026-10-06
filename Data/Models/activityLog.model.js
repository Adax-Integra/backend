import { supabase } from '../Config/supabase.js';

// V-06 shows 10 entries per page, the same size as the records listing in V-05
const PAGE_SIZE = 10;

// The name of who did the action comes from the user table through
const ACTIVITY_LOG_COLUMNS = `
  log_id,
  action,
  entity,
  entity_id,
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

    const logs = await ActivityLogModel.attachTargets(data ?? []);

    return {
      logs,
      total: count ?? 0,
      page,
      limit: PAGE_SIZE,
    };
  }

  /*
  Adds a readable reference of what the action was done to:
  the full name for users and the folio for cases.
  entity_id has no foreign key, so each table is read with one query per page
  */
  static async attachTargets(logs) {
    const userIds = [];
    const caseIds = [];

    for (const log of logs) {
      if (log.entity === 'user' && log.entity_id) {
        userIds.push(log.entity_id);
      }
      if (log.entity === 'case' && log.entity_id) {
        caseIds.push(log.entity_id);
      }
    }

    const targets = {};

    if (userIds.length > 0) {
      const { data, error } = await supabase
        .from('user')
        .select('user_id, name, last_name')
        .in('user_id', userIds);

      if (error) {
        throw new Error(error.message);
      }

      for (const user of data ?? []) {
        targets[user.user_id] =
          `${user.name ?? ''} ${user.last_name ?? ''}`.trim();
      }
    }

    if (caseIds.length > 0) {
      const { data, error } = await supabase
        .from('case')
        .select('case_id, case_number')
        .in('case_id', caseIds);

      if (error) {
        throw new Error(error.message);
      }

      for (const item of data ?? []) {
        targets[item.case_id] = item.case_number;
      }
    }

    return logs.map((log) => ({
      ...log,
      target: targets[log.entity_id] || null,
    }));
  }
}

export default ActivityLogModel;
