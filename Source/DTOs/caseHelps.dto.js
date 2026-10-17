// R-08: formats help types for the app in camelCase.

// The descriptions are saved with a line break at the end, so they are trimmed

class CaseHelpsDTO {
  static helpFromRow(row = {}) {
    return {
      helpId: row?.help_id ?? null,
      description:
        typeof row?.description === 'string' ? row.description.trim() : null,
    };
  }

  // GET /help-types

  static fromHelpTypes(rows = []) {
    return (rows || []).map((row) => CaseHelpsDTO.helpFromRow(row));
  }

  // PUT /cases/:caseId/helps
  static fromAssignment({ caseId, helps = [] } = {}) {
    return {
      caseId: caseId ?? null,
      helps: CaseHelpsDTO.fromHelpTypes(helps),
    };
  }
}

export default CaseHelpsDTO;
