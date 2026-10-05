import DateRangeValidator from '../../Data/Validators/dateRangeValidator.validator.js';
import ReportModel from '../../Data/Models/report.model.js';

class GetReportCsv {
  async execute(startDate, endDate) {
    const { startDate: validStartDate, endDate: validEndDate } =
      DateRangeValidator.validateRange(startDate, endDate);

    const [data] = await Promise.all([
      ReportModel.getInformationForReport(validStartDate, validEndDate),
    ]);

    console.log(data);
    // TODO convert the data from whatever format into a CSV
    // then return the csv
  }
}

export default GetReportCsv;
