import CaseModel from '../../data/models/case.model.js';

class ListCasesUseCase {
  // Collaborator authorization must be added before exposing this listing.
  async execute({ page = 1, limit = 20 } = {}) {
    // Validate the requested page before loading data.
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new Error('page must be a positive integer.');
    }

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer between 1 and 100.');
    }

    const from = (page - 1) * limit;
    const to = from + limit;

    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
      throw new Error('Requested page is out of range.');
    }

    // Read every model page so urgent cases are not missed on later pages.
    const allCases = [];
    let modelPage = 1;
    let total;

    // Gather the cases before deciding which ones to show first based on urgency
    do {
      const result = await CaseModel.findAll({ page: modelPage, limit: 100 });
      allCases.push(...result.cases);
      total = result.total;
      modelPage += 1;

      // Stop if no more rows are available (including an empty database).
      if (result.cases.length === 0) {
        break;
      }
    } while (allCases.length < total);

    // Calculate the urgency level for each case
    const casesWithUrgency = allCases.map((caseData) => {
      let severity = null;

      // A case takes the highest severity among its active violence types.
      for (const link of caseData.case_violence ?? []) {
        const value = link.violence_types?.severity;

        if (Number.isInteger(value) && value >= 1 && value <= 10) {
          severity = severity === null ? value : Math.max(severity, value);
        }
      }

      let urgency = 'Sin evaluar';

      if (severity >= 8) {
        urgency = 'Alta';
      } else if (severity >= 4) {
        urgency = 'Media';
      } else if (severity >= 1) {
        urgency = 'Baja';
      }

      return { ...caseData, severity, urgency };
    });

    // Higher severity comes first; null scores go last.
    // Equal scores retain the model's order by update time and case ID.
    casesWithUrgency.sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));

    // slice excludes the end position. Paginate only after sorting all cases.
    return {
      cases: casesWithUrgency.slice(from, to),
      total: casesWithUrgency.length,
      page,
      limit,
    };
  }
}

export default ListCasesUseCase;
