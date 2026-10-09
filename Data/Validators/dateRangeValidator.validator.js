import DateValidator from './date.validator.js';

function validationError(message) {
  return new Error(message);
}

class DateRangeValidator {
  static validateRange(startDate, endDate) {
    const validStartDate = DateValidator.validateDate(startDate);
    const validEndDate = DateValidator.validateDate(endDate);

    // Makes sure the dates are present in the petition
    if (!validStartDate || !validEndDate) {
      throw validationError('start-date and end-date parameters are required');
    }

    // Validate if the endDate is before the startDate
    if (validEndDate < validStartDate) {
      throw validationError('end-date cannot be before start-date');
    }

    // Validate if the dates are not more than 1 year appart
    const start = new Date(`${validStartDate}T00:00:00.000Z`);
    const end = new Date(`${validEndDate}T00:00:00.000Z`);
    const maximumEndDate = new Date(start);
    maximumEndDate.setUTCFullYear(maximumEndDate.getUTCFullYear() + 1);

    if (end > maximumEndDate) {
      throw validationError('date range cannot exceed one year');
    }

    return {
      startDate: validStartDate,
      endDate: validEndDate,
    };
  }
}

export default DateRangeValidator;
