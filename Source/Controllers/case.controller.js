import ListCasesUseCase from '../../Domain/UseCases/listCases.usecase.js';
import CaseListDTO from '../DTOs/caseList.dto.js';

const listCasesUseCase = new ListCasesUseCase();

class CaseController {
  async listCases(req, res) {
    // Query parameters arrive as strings. Use defaults only when omitted.
    const { page: pageQuery = '1', limit: limitQuery = '20' } = req.query;

    // Reject empty values, repeated parameters, objects, and non-integer text.
    if (
      typeof pageQuery !== 'string' ||
      typeof limitQuery !== 'string' ||
      !/^\d+$/.test(pageQuery) ||
      !/^\d+$/.test(limitQuery)
    ) {
      return res.status(400).json({
        success: false,
        error: 'page and limit must be positive integers.',
      });
    }

    const page = Number(pageQuery);
    const limit = Number(limitQuery);

    // Validate the requested range before calling the use case.
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(page * limit)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination: page or limit is out of range (maximum limit: 100).',
      });
    }

    try {
      const result = await listCasesUseCase.execute({ page, limit });
      const payload = new CaseListDTO(result).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      // Keep database details in server logs instead of exposing them to clients.
      console.error('Failed to list cases:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve cases.',
      });
    }
  }
}

export default new CaseController();
