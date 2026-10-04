import DateRangeValidator from '../../Data/Validators/dateRangeValidator.validator.js';

class GetReportCsv {
  async execute(startDate, endDate) {
    const { startDate: validStartDate, endDate: validEndDate } =
      DateRangeValidator.validateRange(startDate, endDate);

    console.log(validStartDate);
    console.log(validEndDate); // just so it compiles
  }
}

export default GetReportCsv;
