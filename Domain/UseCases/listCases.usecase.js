import CaseModel from '../../Data/Models/case.model.js';
import { calculateCaseUrgency } from '../../Data/Services/caseUrgency.helper.js';

// Match names without requiring accents, capitalization, or exact spacing.
function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

class ListCasesUseCase {
  // Collaborator authorization must be added before exposing this listing.
  async execute({ page = 1, limit = 20, search = '', urgency = '' } = {}) {
    if (typeof search !== 'string' || typeof urgency !== 'string') {
      throw new Error('search and urgency must be single text values.');
    }

    const query = normalizeSearch(search);
    const urgencyFilter = urgency.trim();
    if (
      !['', 'Todas', 'Alta', 'Media', 'Baja', 'Sin evaluar'].includes(
        urgencyFilter
      )
    ) {
      throw new Error(
        'urgency must be Alta, Media, Baja, Sin evaluar, or Todas.'
      );
    }

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
    const casesWithUrgency = allCases.map((caseData) => ({
      ...caseData,
      ...calculateCaseUrgency(caseData.case_violence),
    }));

    // Search and filter before counting and paginating.
    const matchingCases = casesWithUrgency.filter((caseData) => {
      const state = normalizeSearch(caseData.state ?? '');

      // Closed cases do not belong to the collaborator's priority listing.
      if (state === 'closed' || state === 'cerrado') {
        return false;
      }

      const user = caseData.record?.user;
      const fullName = [user?.name, user?.last_name].filter(Boolean).join(' ');

      const violenceTypes = (caseData.case_violence ?? [])
        .map((link) => link.violence_types?.description)
        .filter(Boolean);

      // Ignore deleted assignments and deleted collaborators.
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
        );

      const searchableValues = [
        fullName,
        caseData.case_id ?? '',
        caseData.case_number ?? '',
        ...violenceTypes,
        ...assignedNames,
      ];

      const matchesSearch = searchableValues.some((value) =>
        normalizeSearch(value).includes(query)
      );

      const matchesUrgency =
        urgencyFilter === '' ||
        urgencyFilter === 'Todas' ||
        caseData.urgency === urgencyFilter;

      return matchesSearch && matchesUrgency;
    });

    // Higher severity comes first; null scores go last.
    // Equal scores retain the model's order by update time and case ID.
    matchingCases.sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));

    // slice excludes the end position. Paginate only after sorting all cases.
    return {
      cases: matchingCases.slice(from, to),
      total: matchingCases.length,
      page,
      limit,
    };
  }
}

export default ListCasesUseCase;
