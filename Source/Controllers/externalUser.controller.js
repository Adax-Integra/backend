import CheckPreSubmissionDataUseCase from '../../Domain/UseCases/checkPreSubmissionData.usecase.js';
import EditPreSubmissionDataUseCase from '../../Domain/UseCases/editPreSubmissionData.usecase.js';
import CreateAccountUseCase from '../../Domain/UseCases/createAccount.usecase.js';
import PreSubmissionDTO from '../DTOs/preSubmission.dto.js';
import CreateCaseUseCase from '../../Domain/UseCases/createCase.usecase.js';
import CreateCaseDTO from '../DTOs/createCase.dto.js';
import CreateAccountDTO from '../DTOs/createAccount.dto.js';

const checkPreSubmissionDataUseCase = new CheckPreSubmissionDataUseCase();
const editPreSubmissionDataUseCase = new EditPreSubmissionDataUseCase();
const createCaseUseCase = new CreateCaseUseCase();
const createAccountUseCase = new CreateAccountUseCase();

// In multer requests, nested objects arrive as JSON strings
const JSON_FIELDS = ['profile', 'address'];

function parseJsonFields(body = {}) {
  const parsed = { ...body };

  for (const field of JSON_FIELDS) {
    if (typeof parsed[field] !== 'string') continue;

    try {
      parsed[field] = JSON.parse(parsed[field]);
    } catch {
      throw new Error(`${field} must be valid JSON.`);
    }
  }

  return parsed;
}

class ExternalUserController {
  // receives the registration request and sends the result to the app
  async createAccount(req, res) {
    try {
      // passes the form data to the use case to create the account
      const created = await createAccountUseCase.execute(req.body);
      // prepares the account information that will be sent to the app
      const payload = new CreateAccountDTO(created).toJSON();

      // indicates that the account was created
      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      console.error('Failed to create account:', error);

      // validator errors have no status; so they default to 400
      const status = error.status ?? 400;

      return res.status(status).json({
        success: false,
        code: error.code ?? 'VALIDATION_ERROR',
        error: error.message,
      });
    }
  }

  async getPreSubmissionData(req, res) {
    try {
      const { userId } = req.params;
      const data = await checkPreSubmissionDataUseCase.execute(userId);
      const payload = new PreSubmissionDTO(data).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async editPreSubmissionData(req, res) {
    try {
      const { userId } = req.params;
      const updatedData = await editPreSubmissionDataUseCase.execute(
        userId,
        parseJsonFields(req.body),
        req.files
      );
      const payload = new PreSubmissionDTO(updatedData).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  //R-02 Registers the details of a case for an external user
  async createCase(req, res) {
    try {
      const { userId } = req.params;
      const created = await createCaseUseCase.execute(userId, req.body);
      const payload = new CreateCaseDTO(created).toJSON();

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to create case: ', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to create the case',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  }
}

export default new ExternalUserController();
