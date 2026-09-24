import GetCaseByIdUseCase from '../../Domain/UseCases/getCaseById.usecase.js';
import ListCasesUseCase from '../../Domain/UseCases/listCases.usecase.js';
import CaseListDTO from '../DTOs/caseList.dto.js';
import GetAllCasesFromUser from '../../Domain/UseCases/getAllCasesFromUser.usecase.js';
import CaseSummaryDTO from '../DTOs/getAllCases.dto.js';

const listCasesUseCase = new ListCasesUseCase();
const getCaseByIdUseCase = new GetCaseByIdUseCase();
const getAllCasesFromUser = new GetAllCasesFromUser();

class CaseController {
  async listCases(req, res) {
    // Query parameters arrive as strings. Use defaults only when omitted.
    const {
      page: pageQuery = '1',
      limit: limitQuery = '20',
      search = '',
      urgency = '',
    } = req.query;

    if (typeof search !== 'string' || typeof urgency !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'search and urgency must be single text values.',
      });
    }

    const urgencyFilter = urgency.trim();
    if (
      !['', 'Todas', 'Alta', 'Media', 'Baja', 'Sin evaluar'].includes(urgencyFilter)
    ) {
      return res.status(400).json({
        success: false,
        error: 'urgency must be Alta, Media, Baja, Sin evaluar, or Todas.',
      });
    }

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
        error:
          'Invalid pagination: page or limit is out of range (maximum limit: 100).',
      });
    }

    try {
      const result = await listCasesUseCase.execute({
        page,
        limit,
        search: search.trim(),
        urgency: urgencyFilter,
      });
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

  async getCaseById(req, res) {
    try {
      const { caseId } = req.params;

      const data = await getCaseByIdUseCase.execute(caseId);

      return res.status(200).json({
        success: true,
        data: data,
      });
    } catch {
      return res.status(400).json({
        success: false,
      });
    }
  }

  async getCasesByUser(req, res) {
    try {
      const { userId } = req.params;
      const { cases } = await getAllCasesFromUser.execute(userId);

      return res.status(200).json({
        success: true,
        data: CaseSummaryDTO.fromRows(cases),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new CaseController();
