/*
G-16: The admin consults the list of external accounts.
The query can choose the page, search by name or email, filter 
by the account status and change the order of the list.
*/
const PAGE_SIZE = 10;
const MAX_SEARCH_LENGTH = 100;
const ALLOWED_STATUSES = ['active', 'inactive', 'all'];
const ALLOWED_SORTS = ['recent', 'alphabetical'];

//Builds an Error carrying the per-field reasons so the
// controller can answer with { errors: { field: reason } }
function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

class ExternalUserQueryValidator {
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

    //An empty search means no filter
    let search = '';
    if (query.search !== undefined) {
      if (typeof query.search !== 'string') {
        errors.search = 'search must be a text value.';
      } else if (query.search.trim().length > MAX_SEARCH_LENGTH) {
        errors.search = `search must have at most ${MAX_SEARCH_LENGTH} characters.`;
      } else {
        search = query.search.trim();
      }
    }

    //Only active accounts are shown when status is not sent
    const status = query.status ?? 'active';
    if (!ALLOWED_STATUSES.includes(status)) {
      errors.status = 'status must be active, inactive or all.';
    }

    //The newest accounts are shown first when sort is not sent
    const sort = query.sort ?? 'recent';
    if (!ALLOWED_SORTS.includes(sort)) {
      errors.sort = 'sort must be recent or alphabetical.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return { page, search, status, sort };
  }
}

export default ExternalUserQueryValidator;
