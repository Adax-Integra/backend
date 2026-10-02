import ListRecordsUseCase from '../../Domain/UseCases/listRecords.usecase.js';
import RecordListDTO from '../DTOs/recordList.dto.js';

const listRecordsUseCase = new ListRecordsUseCase();

class RecordController {
  async listRecords(req, res) {
    const {
      page: pageQuery = '1',
      search = '',
      hasOpenCases: hasOpenCasesQuery,
      status: statusQuery,
    } = req.query;

    // Reject repeated parameters, objects, and non-integer page values.
    if (typeof pageQuery !== 'string' || !/^\d+$/.test(pageQuery)) {
      return res.status(400).json({
        success: false,
        error: 'page must be a positive integer.',
      });
    }

    const page = Number(pageQuery);

    // Validate the page and its range for the fixed size of 10 records.
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(page * 10)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Requested page is out of range.',
      });
    }

    if (typeof search !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'search must be a text value.',
      });
    }

    // Only omission, "true", and "false" are valid filter values.
    if (
      hasOpenCasesQuery !== undefined &&
      hasOpenCasesQuery !== 'true' &&
      hasOpenCasesQuery !== 'false'
    ) {
      return res.status(400).json({
        success: false,
        error: 'hasOpenCases must be true or false when provided.',
      });
    }

    // Only teh four lifecycle status are valid filter values.
    const ALLOWED_STATUSES = ['SIN_EMPEZAR', 'EN_REVISION', 'EN_SEGUIMIENTO', 'COMPLETADO'];

    if (statusQuery !== undefined && !ALLOWED_STATUSES.includes(statusQuery)) {
      return res.status(400).json({
        success: false,
        error: 'status must be a valid record status when provided.',
      });
    }
    
    // Omission means no status filter.
    const status = statusQuery === undefined ? null : statusQuery;

    // Converts the filter text to a boolean; null means no filter.
    const hasOpenCases =
      hasOpenCasesQuery === undefined ? null : hasOpenCasesQuery === 'true';

    try {
      const result = await listRecordsUseCase.execute({
        page,
        search: search.trim(),
        hasOpenCases,
        status,
      });

      // Formats the result into the response structure expected by the client.
      const payload = new RecordListDTO(result).toJSON();

      // An empty listing is a successful response with records: [].
      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      // Keep database details in server logs
      console.error('Failed to list records:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve records.',
      });
    }
  }
}

export default new RecordController();
