import UploadDocumentsUseCase from '../../Domain/UseCases/uploadDocuments.usecase.js';
import GetExternalUserDocumentsUseCase from '../../Domain/UseCases/getExternalUserDocuments.usecase.js';
import GetDocumentFileUseCase from '../../Domain/UseCases/getDocumentFile.usecase.js';
import ExternalUserDocumentsDTO from '../DTOs/externalUserDocuments.dto.js';
import publicBaseUrl from '../../Data/Services/publicBaseUrl.helper.js';

const uploadDocumentsUseCase = new UploadDocumentsUseCase();
const getExternalUserDocumentsUseCase = new GetExternalUserDocumentsUseCase();
const getDocumentFileUseCase = new GetDocumentFileUseCase();

class UploadDocumentsController {
  /*
  R-06: The owner reads their own documents, same answer as V-13.
  Unlike V-13 it is not saved in the activity log because the user
  is looking at their own data.
  */
  async getDocuments(req, res) {
    try {
      const documents = await getExternalUserDocumentsUseCase.execute(
        req.params.userId,
        publicBaseUrl(req)
      );
      const payload = new ExternalUserDocumentsDTO(documents).toJSON();

      //The response carries signed links, it must not be cached
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
        req.files ?? {},
        publicBaseUrl(req)
      );

      //The response carries signed links, it must not be cached
      res.set('Cache-Control', 'no-store');

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

  /*
  R-06 / V-13: returns a document already decrypted. It has no
  authMiddleware because the apps open the link like the old Supabase
  signed URLs (without the session token); the link token is the permission.
  */
  async getDocumentFile(req, res) {
    try {
      const { buffer, contentType } = await getDocumentFileUseCase.execute(
        req.params.token
      );

      // The decrypted image must not stay in any cache
      res.set({
        'Cache-Control': 'no-store',
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
      });

      return res.status(200).send(buffer);
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        // Only the message is logged, never the token, the path or the file
        console.error('Failed to get document file:', error.message);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the document.',
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
