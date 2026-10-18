// Title and sentence for each action saved in activity_log.
// New actions only need a new line here when other features start logging them
const ACTIONS = {
  // G-07: the admin edits the data of an external user
  update_external_profile: {
    title: 'Edición de datos de usuaria',
    verb: 'editó los datos de',
  },
  // G-03: the admin creates a collaborator account
  create_collaborator: {
    title: 'Alta de colaboradora',
    verb: 'dio de alta a',
  },
  // R-03: a collaborator registers the record of an external user
  register_external_user: {
    title: 'Registro de expediente',
    verb: 'registró el expediente de',
  },
  // V-11: a case is closed
  close_case: {
    title: 'Cierre de caso',
    verb: 'cerró el caso',
  },
  // R-11: an internal user creates a case for an external user
  internal_create_case: {
    title: 'Registro de caso',
    verb: 'registró el caso',
  },
  //V-13: an internal user views the documents of an external user
  view_external_documents: {
    title: 'Consulta de documentos',
    verb: 'consultó los documentos',
  },
  // R-08: an internal user assigns help types to a case
  assign_case_help: {
    title: 'Asignación de ayudas',
    verb: 'asignó ayudas al caso de',
  },
  // R-10: an internal user is assigned to a case
  assign_case_collaborator: {
    title: 'Asignación de colaboradora',
    verb: 'asignó una colaboradora al caso de',
  },
  // G-08: an external or internal user deactivates her own account
  deactivate_account: {
    title: 'Baja de cuenta',
    verb: 'desactivó la cuenta de',
  },
  // G-04: the admin deactivates a collaborator account
  deactivate_collaborator: {
    title: 'Desactivación de colaboradora',
    verb: 'desactivó la cuenta de',
  },
  // G-04: the admin reactivates a collaborator account
  reactivate_collaborator: {
    title: 'Reactivación de colaboradora',
    verb: 'reactivó la cuenta de',
  },
  // G-04: entries saved before the action was split in two
  update_collaborator_status: {
    title: 'Cambio de estatus de colaboradora',
    verb: 'cambió el estatus de',
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
        created_at: log.created_at
          ? new Date(log.created_at).toISOString()
          : null,
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
