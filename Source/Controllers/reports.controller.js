import GetReportCsv from '../../Domain/UseCases/getReportCsv.usecase.js';

const getReportCsv = new GetReportCsv();

class ReportsController {
  getReportCsv = async (req, res) => {
    try {
      const startDate = req.query['start-date'];
      const endDate = req.query['end-date'];

      const response = await getReportCsv.execute(startDate, endDate);

      console.log(response); // just so it compiles
      //   const rows = Array.isArray(response) ? response : response?.cases;

      //   if (!Array.isArray(rows)) {
      //     throw new Error('The cases use case must return an array of cases.');
      //   }

      //   const payload = getAllCasesDTO.fromRows(rows);

      //   return res.status(200).json({
      //     success: true,
      //     data: payload,
      //   });
      // } catch (error) {
      //   return res.status(400).json({
      //     success: false,
      //     error: error.message,
      //   });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export default new ReportsController();
