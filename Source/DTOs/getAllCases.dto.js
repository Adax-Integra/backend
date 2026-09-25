class CaseSummaryDTO {
  constructor({
    case_id,
    written_description,
    written_helps_wanted,
    has_lawyer,
    state,
    created_at,
    updated_at,
    case_help = [],
    case_violence = [],
  }) {
    this.caseId = case_id ?? null;
    this.writtenDescription = written_description ?? null;
    this.writtenHelpsWanted = written_helps_wanted ?? null;
    this.hasLawyer = Boolean(has_lawyer);
    this.state = state ?? null;
    this.createdAt = created_at ? new Date(created_at).toISOString() : null;
    this.updatedAt = updated_at ? new Date(updated_at).toISOString() : null;

    // Filter out softly deleted records and extract the description text
    const validHelps = case_help
      .filter(
        (ch) => ch.deleted_at === null && ch.help_types?.deleted_at === null
      )
      .map((ch) => ch.help_types.description);

    const validViolences = case_violence
      .filter(
        (cv) => cv.deleted_at === null && cv.violence_types?.deleted_at === null
      )
      .map((cv) => cv.violence_types.description);

    // Use Set to remove any duplicates
    this.helps = [...new Set(validHelps)];
    this.violenceTypes = [...new Set(validViolences)];
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
   * Maps an array of database rows to an array of serialized JSON objects.
   */
  static fromRows(rows = []) {
    if (!Array.isArray(rows)) {
      throw new TypeError('Case rows must be an array.');
    }

    return rows.map((row) => new CaseSummaryDTO(row).toJSON());
  }
}

export default CaseSummaryDTO;
