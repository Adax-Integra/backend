// Readable text for each action saved in activity_log
const ACTION_LABELS = {
  update_external_profile: 'Editó los datos de una usuaria',
};

const UNKNOWN_ACTOR = 'Usuaria no disponible';
const NO_REASON = 'Sin motivo registrado';

class ActivityLogDTO {
  constructor({ logs = [], total = 0, page = 1, limit = 10 } = {}) {
    this.logs = logs.map((log) => {
      const fullName = [log.actor?.name, log.actor?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

      const reason =
        typeof log.details?.reason === 'string'
          ? log.details.reason.trim()
          : '';

      return {
        log_id: log.log_id,
        actor_name: fullName || UNKNOWN_ACTOR,
        action: log.action,
        // Unknown actions are shown with their saved name
        action_label: ACTION_LABELS[log.action] ?? log.action,
        reason: reason || NO_REASON,
        created_at: log.created_at,
      };
    });

    this.total = total;
    this.page = page;
    this.limit = limit;
  }

  toJSON() {
    return {
      logs: this.logs,
      total: this.total,
      page: this.page,
      limit: this.limit,
    };
  }
}

export default ActivityLogDTO;
