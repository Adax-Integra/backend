class CollaboratorCasesDTO {
  constructor({ cases = [], total = 0 } = {}) {
    this.cases = cases.map((caseData) => {
      // Name of the external user that the record is associated with
      const user = caseData.record?.user;

      // Joins the available name parts without showing null or undefined
      const name = [user?.name, user?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

      // Keeps only the description
      const violenceTypes = (caseData.case_violence ?? [])
        .map((link) => link.violence_types?.description)
        .filter(Boolean);

      return {
        case_id: caseData.case_id,
        case_number: caseData.case_number ?? null,
        name,
        violence_types: violenceTypes,
        state: caseData.state,
        updated_at: caseData.updated_at ?? null,
      };
    });

    // Real number of assigned cases
    this.total = total;
  }

  toJSON() {
    return {
      cases: this.cases,
      total: this.total,
    };
  }
}

export default CollaboratorCasesDTO;
