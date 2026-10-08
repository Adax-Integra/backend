function toUtcIso(value) {
  if (!value) {
    return null;
  }
  const text = String(value);
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
  return new Date(hasZone ? text : `${text}Z`).toISOString();
}

class CaseSummaryDTO {
  constructor({
    case_id,
    case_number,
    state,
    updated_at,
    record = null,
    case_violence = [],
    case_assignment = [],
  }) {
    this.caseId = case_id ?? null;
    // Folio shown to the user, e.g. C-26-9999
    this.caseNumber = case_number ?? null;
    // Owner of the case, it comes from the record the case belongs to
    const owner = record?.user;
    this.userName = owner
      ? `${owner.name ?? ''} ${owner.last_name ?? ''}`.trim()
      : null;
    this.state = state ?? null;
    // Dates are always returned in UTC (ending in Z) so the app can show the local time
    this.updatedAt = toUtcIso(updated_at);

    // Filter out softly deleted records and extract the description text
    const validViolences = case_violence
      .filter(
        (cv) => cv.deleted_at === null && cv.violence_types?.deleted_at === null
      )
      .map((cv) => cv.violence_types.description);

    // Use Set to remove any duplicates
    this.violenceTypes = [...new Set(validViolences)];

    // Internal users assigned to the case, without softly deleted assignments
    this.assignedUsers = case_assignment
      .filter((ca) => ca.deleted_at === null && ca.user?.deleted_at === null)
      .map((ca) => ({
        userId: ca.user.user_id,
        name: `${ca.user.name ?? ''} ${ca.user.last_name ?? ''}`.trim(),
      }));
  }

  /**
   * Serializes the instance to a JSON object.
   */
  toJSON() {
    return {
      caseId: this.caseId,
      caseNumber: this.caseNumber,
      userName: this.userName,
      state: this.state,
      updatedAt: this.updatedAt,
      violenceTypes: this.violenceTypes,
      assignedUsers: this.assignedUsers,
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
