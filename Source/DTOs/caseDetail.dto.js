function toUtcIso(value) {
  if (!value) {
    return null;
  }
  const text = String(value);
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
  return new Date(hasZone ? text : `${text}Z`).toISOString();
}

class CaseDetailDTO {
  constructor(data = {}) {
    const {
      case_id,
      case_number,
      written_description,
      written_helps_wanted,
      has_lawyer,
      state,
      record_id,
      created_at,
      updated_at,
      record = null,
      case_steps = [],
      case_help = [],
      case_violence = [],
      case_assignment = [],
    } = data || {};

    // Base Case Attributes
    this.case_id = case_id ?? null;
    this.case_number = case_number ?? null;
    this.written_description = written_description ?? null;
    this.written_helps_wanted = written_helps_wanted ?? null;
    this.has_lawyer = Boolean(has_lawyer);
    this.state = state ?? null;
    this.record_id = record_id ?? null;
    // Dates are always returned in UTC (ending in Z) so the app can show the local time
    this.created_at = toUtcIso(created_at);
    this.updated_at = toUtcIso(updated_at);

    // Record number is shown instead of the UUID
    this.record = {
      record_id: record?.record_id ?? null,
      record_number: record?.record_number ?? null,
      user: {
        user_id: record?.user?.user_id ?? null,
        name: record?.user?.name ?? null,
        last_name: record?.user?.last_name ?? null,
      },
    };

    this.case_steps = (case_steps || []).map((step) => ({
      case_step_id: step.case_step_id ?? null,
      step_number: step.step_number ?? null,
      status: step.status ?? null,
    }));

    this.case_violence = (case_violence || []).map((violence) => ({
      violence_types: {
        violence_id: violence.violence_types?.violence_id ?? null,
        description: violence.violence_types?.description ?? null,
        severity: violence.violence_types?.severity ?? null,
      },
    }));

    this.case_help = (case_help || []).map((help) => ({
      help_types: {
        help_id: help.help_types?.help_id ?? null,
        description: help.help_types?.description ?? null,
      },
    }));

    // R-10: collaborators currently assigned, removed ones are already filtered by the model
    this.case_assignment = (case_assignment || []).map((assignment) => ({
      user_id: assignment.user_id ?? null,
    }));
  }

  toJSON() {
    return {
      case_id: this.case_id,
      case_number: this.case_number,
      written_description: this.written_description,
      written_helps_wanted: this.written_helps_wanted,
      has_lawyer: this.has_lawyer,
      state: this.state,
      record_id: this.record_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      record: this.record,
      case_steps: this.case_steps,
      case_violence: this.case_violence,
      case_help: this.case_help,
      case_assignment: this.case_assignment,
    };
  }
}

export default CaseDetailDTO;
