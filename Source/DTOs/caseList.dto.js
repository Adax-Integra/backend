class CaseListDTO {
  constructor({ cases = [], total = 0, page = 1, limit = 20 } = {}) {
    // Flatten the nested relations into the fields needed by each case card.
    this.cases = cases.map((caseData) => {
      const user = caseData.record?.user;

      // Join the available name parts without displaying null or undefined.
      const name = [user?.name, user?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

      // Return only the descriptions, excluding missing violence types.
      const violenceTypes = (caseData.case_violence ?? [])
        .map((link) => link.violence_types?.description)
        .filter(Boolean);

      return {
        case_id: caseData.case_id,
        name,
        violence_types: violenceTypes,
        state: caseData.state,
        // Preserve the urgency calculated by the use case.
        severity: caseData.severity ?? null,
        urgency: caseData.urgency ?? 'Sin evaluar',
        updated_at: caseData.updated_at ?? null,
      };
    });

    // Preserve the pagination information returned by the use case.
    this.total = total;
    this.page = page;
    this.limit = limit;
  }

  toJSON() {
    return {
      cases: this.cases,
      total: this.total,
      page: this.page,
      limit: this.limit,
    };
  }
}

export default CaseListDTO;
