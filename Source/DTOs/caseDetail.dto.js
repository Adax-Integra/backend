class CaseDetailDTO {
  constructor({
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
  }) {
    this.caseId = case_id ?? null;
    this.caseNumber = case_number ?? null;
    this.writtenDescription = written_description ?? null;
    this.writtenHelpsWanted = written_helps_wanted ?? null;
    this.hasLawyer = Boolean(has_lawyer);
    this.state = state ?? null;
    this.recordId = record_id ?? null;
    this.createdAt = created_at ? new Date(created_at).toISOString() : null;
    this.updatedAt = updated_at ? new Date(updated_at).toISOString() : null;
    this.user = {
      userId: record?.user?.user_id ?? null,
      name: record?.user?.name ?? null,
      lastName: record?.user?.last_name ?? null,
    };
    this.steps = case_steps.map((step) => ({
      caseStepId: step.case_step_id ?? null,
      stepNumber: step.step_number ?? null,
      status: step.status ?? null,
    }));
    this.helps = case_help.map((help) => ({
      helpId: help.help_types?.help_id ?? null,
      description: help.help_types?.description ?? null,
    }));
    this.violenceTypes = case_violence.map((violence) => ({
      violenceId: violence.violence_types?.violence_id ?? null,
      description: violence.violence_types?.description ?? null,
      severity: violence.violence_types?.severity ?? null,
    }));
  }

  toJSON() {
    return {
      caseId: this.caseId,
      caseNumber: this.caseNumber,
      writtenDescription: this.writtenDescription,
      writtenHelpsWanted: this.writtenHelpsWanted,
      hasLawyer: this.hasLawyer,
      state: this.state,
      recordId: this.recordId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      user: this.user,
      steps: this.steps,
      helps: this.helps,
      violenceTypes: this.violenceTypes,
    };
  }
}

export default CaseDetailDTO;
