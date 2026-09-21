class CaseSummaryDTO {
  constructor({
    case_id,
    written_description,
    written_helps_wanted,
    has_lawyer,
    state,
    created_at,
    updated_at,
    helpdescription,
    violencedescription,
    helpDescription,
    violenceDescription,
  }) {
    this.caseId = case_id ?? null;
    this.writtenDescription = written_description ?? null;
    this.writtenHelpsWanted = written_helps_wanted ?? null;
    this.hasLawyer = Boolean(has_lawyer);
    this.state = state ?? null;
    this.createdAt = created_at ? new Date(created_at).toISOString() : null;
    this.updatedAt = updated_at ? new Date(updated_at).toISOString() : null;

    // Handles Postgres lowercase column alias defaults or explicit casing
    const rawHelps = helpDescription ?? helpdescription ?? null;
    const rawViolence = violenceDescription ?? violencedescription ?? null;

    // Splits comma-separated strings into clean JavaScript arrays
    this.helps = rawHelps
      ? rawHelps.split(', ').map((item) => item.trim())
      : [];
    this.violenceTypes = rawViolence
      ? rawViolence.split(', ').map((item) => item.trim())
      : [];
  }

  /**
   * Serializes the instance to a JSON object.
   */
  toJSON() {
    return {
      caseId: this.caseId,
      writtenDescription: this.writtenDescription,
      writtenHelpsWanted: this.writtenHelpsWanted,
      hasLawyer: this.hasLawyer,
      state: this.state,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      helps: this.helps,
      violenceTypes: this.violenceTypes,
    };
  }

  /**
   * Maps an array of database rows to an array of CaseSummaryDTO.
   */
  static fromRows(rows = []) {
    return rows.map((row) => new CaseSummaryDTO(row));
  }
}

export default CaseSummaryDTO;
