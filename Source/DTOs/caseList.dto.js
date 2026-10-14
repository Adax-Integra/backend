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

      // Include only active assignments linked to active users.
      const assignedNames = (caseData.case_assignment ?? [])
        .filter(
          (assignment) =>
            assignment.deleted_at === null &&
            assignment.user != null &&
            assignment.user.deleted_at === null
        )
        .map((assignment) =>
          [assignment.user.name, assignment.user.last_name]
            .filter(Boolean)
            .join(' ')
            .trim()
        )
        .filter(Boolean);

      // Avoid repeating identical names on the card.
      const internsAssigned = [...new Set(assignedNames)];

      return {
        case_id: caseData.case_id,
        case_number: caseData.case_number ?? null,
        name,
        violence_types: violenceTypes,
        interns_assigned: internsAssigned,
        state: caseData.state,
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
