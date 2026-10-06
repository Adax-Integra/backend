// Title and sentence for each action saved in activity_log.
// New actions only need a new line here when other features start logging them
const ACTIONS = {
  update_external_profile: {
    title: 'Edición de datos de usuaria',
    verb: 'editó los datos de',
  },
};

const UNKNOWN_ACTOR = 'Usuaria no disponible';
const UNKNOWN_TARGET = 'un registro no disponible';
const NO_REASON = 'Sin motivo registrado';

class ActivityLogDTO {
  constructor({ logs = [], total = 0, page = 1, limit = 10 } = {}) {
    this.logs = logs.map((log) => {
      const fullName = [log.actor?.name, log.actor?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
      const actorName = fullName || UNKNOWN_ACTOR;

      const reason =
        typeof log.details?.reason === 'string'
          ? log.details.reason.trim()
          : '';

      // Unknown actions are shown with their saved name
      const action = ACTIONS[log.action] ?? {
        title: log.action,
        verb: 'realizó una acción sobre',
      };
      const target = log.target || UNKNOWN_TARGET;

      return {
        log_id: log.log_id,
        actor_name: actorName,
        action: log.action,
        action_label: action.title,
        entity: log.entity ?? null,
        entity_id: log.entity_id ?? null,
        target,
        description: `${actorName} ${action.verb} ${target}`,
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
