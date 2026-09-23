const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validationError(message) {
  return new Error(message);
}

class DateValidator {
  static validateDate(date) {
    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
      throw validationError('date must be in YYYY-MM-DD format.');
    }
    return date;
  }
}

export default DateValidator;
