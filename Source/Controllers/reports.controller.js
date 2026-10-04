import GetReportCsv from '../../Domain/UseCases/getReportCsv.usecase';

const getReportCsv = new GetReportCsv();

class ReportsController {
  getReportCsv = async (req, res) => {
    try {
      const response = await getReportCsv.execute();

      const startDate = req.query['start-date'];
      const endDate = req.query['end-date'];

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'start-date and end-date parameters are required',
        });
      }

      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          error: 'end-date cannot be before start-date',
        });
      }

      console.log(response); //Only so that it allows me to commit

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
