import GetReportCsv from '../../Domain/UseCases/getReportCsv.usecase.js';

const getReportCsv = new GetReportCsv();

class ReportsController {
  getReportCsv = async (req, res) => {
    try {
      const startDate = req.query['start-date'];
      const endDate = req.query['end-date'];

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'start-date and end-date are required',
        });
      }

      const csv = await getReportCsv.execute(startDate, endDate);
      const filename = `report-${startDate}-${endDate}.csv`;

      return res.status(200).type('text/csv').attachment(filename).send(csv);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export default new ReportsController();
