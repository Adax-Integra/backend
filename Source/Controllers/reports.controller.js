import GetReportCsv from '../../Domain/UseCases/getReportCsv.usecase.js';

const getReportCsv = new GetReportCsv();

class ReportsController {
  getReportCsv = async (req, res) => {
    try {
      const startDate = req.query['start-date'];
      const endDate = req.query['end-date'];

      const response = await getReportCsv.execute(startDate, endDate);

      console.log(response); // just so it compiles
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export default new ReportsController();
