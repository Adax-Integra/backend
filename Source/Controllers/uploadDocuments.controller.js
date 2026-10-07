import UploadDocumentsUseCase from '../../Domain/UseCases/uploadDocuments.usecase.js';

const uploadDocumentsUseCase = new UploadDocumentsUseCase();

class UploadDocumentsController {
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
