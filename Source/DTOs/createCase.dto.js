//Response for a newly created case
//Mirrors the field names of CaseSummaryDTO (getAllCases.dto.js) so the case
//the app just created has the same shape as the one listed en "Mis casos"
class CreateCaseDTO {
  constructor({
    case_id,
    state,
    created_at,
    written_description,
    written_helps_wanted,
    has_lawyer,
    helps = [],
  }) {
    this.caseId = case_id ?? null;
    this.state = state ?? null;
    this.createdAt = created_at ? new Date(created_at).toISOString() : null;
    this.writtenDescription = written_description ?? null;
    this.writtenHelpsWanted = written_helps_wanted ?? null;
    this.hasLawyer = Boolean(has_lawyer);
    this.helps = helps;
  }

  toJSON() {
    return {
      caseId: this.caseId,
      state: this.state,
      createdAt: this.createdAt,
      writtenDescription: this.writtenDescription,
      writtenHelpsWanted: this.writtenHelpsWanted,
      hasLawyer: this.hasLawyer,
      helps: this.helps,
    };
  }
}

export default CreateCaseDTO;
