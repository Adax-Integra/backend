//Formats violence types for the app in camelCase

class CaseViolenceTypesDTO {
  static violenceTypeFromRow(row = {}) {
    return {
      violenceId: row?.violence_id ?? null,
      description:
        typeof row?.description === 'string' ? row.description.trim() : null,
      severity: row?.severity ?? null,
    };
  }

  // GET /violence-types

  static fromViolenceTypes(rows = []) {
    return (rows || []).map((row) =>
      CaseViolenceTypesDTO.violenceTypeFromRow(row)
    );
  }

  // PATCH the urgency comes from the selected types

  static fromAssignment({
    caseId,
    violenceIds = [],
    urgency = 'Sin evaluar',
  } = {}) {
    return {
      caseId: caseId ?? null,
      violenceIds,
      urgency,
    };
  }
}

export default CaseViolenceTypesDTO;
