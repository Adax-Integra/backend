/*
V-12: The collaborator consults the cases assigned to her.
Validates the query of GET /api/cases/assigned
*/

const STATUS_VALUES = ['all', 'open', 'closed'];
const URGENCY_VALUES = ['', 'Todas', 'Alta', 'Media', 'Baja', 'Sin evaluar'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

//Builds an Error carrying the per-field reasons so the
//controller can answer with { errors: { field: reason } }
function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

//Returns the default when the parameter is not sent
function parsePositiveInteger(value, field, defaultValue, errors) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    errors[field] = `${field} must be a positive integer.`;
    return defaultValue;
  }

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    errors[field] = `${field} must be a positive integer.`;
    return defaultValue;
  }

  return number;
}

//Repeated parameters arrive as arrays, so only single text values are accepted
function parseText(value, field, errors) {
  if (value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    errors[field] = `${field} must be a single text value.`;
    return '';
  }

  return value.trim();
}

class AssignedCasesQueryValidator {
  static validateQuery(query = {}) {
    const errors = {};

    const page = parsePositiveInteger(query.page, 'page', DEFAULT_PAGE, errors);
    const limit = parsePositiveInteger(
      query.limit,
      'limit',
      DEFAULT_LIMIT,
      errors
    );

    if (!errors.limit && limit > MAX_LIMIT) {
      errors.limit = `limit must be at most ${MAX_LIMIT}.`;
    }

    if (!errors.page && !errors.limit && !Number.isSafeInteger(page * limit)) {
      errors.page = 'page is out of range.';
    }

    //All cases are returned when status is not sent
    const status = parseText(query.status, 'status', errors) || 'all';
    if (!errors.status && !STATUS_VALUES.includes(status)) {
      errors.status = 'status must be all, open or closed.';
    }

    const search = parseText(query.search, 'search', errors);

    const urgency = parseText(query.urgency, 'urgency', errors);
    if (!errors.urgency && !URGENCY_VALUES.includes(urgency)) {
      errors.urgency =
        'urgency must be Alta, Media, Baja, Sin evaluar or Todas.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return { status, search, urgency, page, limit };
  }
}

export default AssignedCasesQueryValidator;
