import DateRangeValidator from '../../Data/Validators/dateRangeValidator.validator.js';
import ReportModel from '../../Data/Models/report.model.js';
import ReportDataToCsvConverter from '../../Data/Services/reportDataToCsv.converter.js';

class GetReportCsv {
  async execute(startDate, endDate) {
    const { startDate: validStartDate, endDate: validEndDate } =
      DateRangeValidator.validateRange(startDate, endDate);

    const [data] = await Promise.all([
      ReportModel.getInformationForReport(validStartDate, validEndDate),
    ]);

    return ReportDataToCsvConverter.convert(data, validStartDate, validEndDate);
  }
}

export default GetReportCsv;
