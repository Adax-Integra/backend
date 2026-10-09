/*V-06: The admin consults the activity log.
The query can choose the page and filter by a date and time range (from / to)
*/
const PAGE_SIZE = 10;

// ISO date and time with its time zone, for example 2026-10-04T05:34:18Z
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;

//Builds an Error carrying the per-field reasons so the controller can answer
//with { errors: { field: reason } }
function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

//Returns the date in UTC ISO format, or null when the parameter is not sent
function parseDateTime(value, field, errors) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || !DATE_TIME_PATTERN.test(value)) {
    errors[field] =
      `${field} must be a date and time with time zone, for example 2026-10-04T05:34:18Z.`;
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors[field] = `${field} must be a valid date and time.`;
    return null;
  }

  return date.toISOString();
}

class ActivityLogQueryValidator {
  static validateQuery(query = {}) {
    const errors = {};

    //The first page is used when page is not sent
    let page = 1;
    if (query.page !== undefined) {
      if (typeof query.page !== 'string' || !/^\d+$/.test(query.page)) {
        errors.page = 'page must be a positive integer.';
      } else {
        page = Number(query.page);
        if (
          !Number.isSafeInteger(page) ||
          page < 1 ||
          !Number.isSafeInteger(page * PAGE_SIZE)
        ) {
          errors.page = 'page is out of range.';
        }
      }
    }

    const from = parseDateTime(query.from, 'from', errors);
    const to = parseDateTime(query.to, 'to', errors);

    //Both values are in the same ISO format, so they can be compared as text
    if (from && to && from > to) {
      errors.to = 'to must be later than from.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return { page, from, to };
  }
}

export default ActivityLogQueryValidator;
