import CaseModel from '../../Data/Models/case.model.js';
import UserIdValidator from '../../Data/Validators/userId.validator.js';
import { calculateCaseUrgency } from '../../Data/Services/caseUrgency.helper.js';

// Size of each model page while gathering the assigned cases
const MODEL_PAGE_SIZE = 100;

// Match text without requiring accents, capitalization, or exact spacing
function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function isClosed(caseData) {
  const state = normalizeSearch(caseData.state ?? '');
  return state === 'closed' || state === 'cerrado';
}

// Missing or invalid dates are treated as the oldest
function getTime(value) {
  const time = Date.parse(value ?? '');
  return Number.isNaN(time) ? 0 : time;
}

// Same searchable fields as GET /api/cases: name, ids, violence types and interns
function matchesSearch(caseData, query) {
  const user = caseData.record?.user;
  const fullName = [user?.name, user?.last_name].filter(Boolean).join(' ');

  const violenceTypes = (caseData.case_violence ?? [])
    .map((link) => link.violence_types?.description)
    .filter(Boolean);

  // Ignore deleted assignments and deleted collaborators
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

  return searchableValues.some((value) =>
    normalizeSearch(value).includes(query)
  );
}

// V-12: The collaborator consults her assigned cases, open and closed.
class ListAssignedCasesUseCase {
  async execute(
    userId,
    { status = 'all', search = '', urgency = '', page = 1, limit = 20 } = {}
  ) {
    const validUserId = UserIdValidator.validateUserId(userId);
    const query = normalizeSearch(search);

    // Read every model page so the severity order covers all the assigned cases
    const allCases = [];
    let modelPage = 1;
    let total;

    do {
      const result = await CaseModel.findPageByAssignedUser(validUserId, {
        page: modelPage,
        limit: MODEL_PAGE_SIZE,
      });
      allCases.push(...result.cases);
      total = result.total;
      modelPage += 1;

      //Stop if no more rows are available
      if (result.cases.length === 0) {
        break;
      }
    } while (allCases.length < total);

    const matchingCases = allCases
      .map((caseData) => ({
        ...caseData,
        ...calculateCaseUrgency(caseData.case_violence),
      }))
      .filter((caseData) => {
        const closed = isClosed(caseData);

        if (status === 'open' && closed) {
          return false;
        }

        if (status === 'closed' && !closed) {
          return false;
        }

        const matchesUrgency =
          urgency === '' || urgency === 'Todas' || caseData.urgency === urgency;

        return matchesUrgency && matchesSearch(caseData, query);
      });

    // Open cases first, highest severity first (null scores go last).
    // Closed cases go after them, most recently updated first.
    // sort() is stable, so ties keep the model order (updated_at, case_id)
    matchingCases.sort((a, b) => {
      const aClosed = isClosed(a);
      const bClosed = isClosed(b);

      if (aClosed !== bClosed) {
        return aClosed ? 1 : -1;
      }

      if (!aClosed) {
        return (b.severity ?? 0) - (a.severity ?? 0);
      }

      return getTime(b.updated_at) - getTime(a.updated_at);
    });

    // Paginate only after filtering and sorting every case
    const from = (page - 1) * limit;

    return {
      cases: matchingCases.slice(from, from + limit),
      total: matchingCases.length,
      page,
      limit,
    };
  }
}

export default ListAssignedCasesUseCase;
