import UploadDocumentsUseCase from '../../Domain/UseCases/uploadDocuments.usecase.js';
import GetExternalUserDocumentsUseCase from '../../Domain/UseCases/getExternalUserDocuments.usecase.js';
import ExternalUserDocumentsDTO from '../DTOs/externalUserDocuments.dto.js';

const uploadDocumentsUseCase = new UploadDocumentsUseCase();
const getExternalUserDocumentsUseCase = new GetExternalUserDocumentsUseCase();

class UploadDocumentsController {
  /*
  R-06: The owner reads their own documents, same answer as V-13.
  Unlike V-13 it is not saved in the activity log because the user
  is looking at their own data.
  */
  async getDocuments(req, res) {
    try {
      const documents = await getExternalUserDocumentsUseCase.execute(
        req.params.userId
      );
      const payload = new ExternalUserDocumentsDTO(documents).toJSON();

      //The response carries signed URLs, it must not be cached
      res.set('Cache-Control', 'no-store');

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to get documents:', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the documents.',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  // R-06: Receives document uploads from Android or iOS.
  async uploadDocuments(req, res) {
    try {
      const { userId } = req.params;

      const documents = await uploadDocumentsUseCase.execute(
        userId,
        req.files ?? {}
      );

      return res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      const status =
        error.message === 'At least one document is required.'
          ? 400
          : error.message === 'User documents not found.'
            ? 404
            : (error.statusCode ?? 500);

      if (status >= 500) {
        console.error('Failed to upload documents:', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to upload documents.',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new UploadDocumentsController();
