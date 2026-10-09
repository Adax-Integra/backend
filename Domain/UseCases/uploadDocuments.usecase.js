import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';
import validIdValidator from '../../Data/Validators/validId.validator.js';

const DOCUMENT_KEYS = ['identity_document', 'proof_of_address'];

class UploadDocumentsUseCase {
  async execute(userId, files = {}) {
    const validUserId = validIdValidator.validateId(userId);

    const hasFiles = DOCUMENT_KEYS.some((key) => files[key]?.[0]);

    if (!hasFiles) {
      throw new Error('At least one document is required.');
    }

    const currentDocuments =
      await ExternalUserDocumentsModel.findByUserId(validUserId);

    if (!currentDocuments) {
      throw new Error('User documents not found.');
    }

    const uploadedPaths = [];
    const documentUpdates = {};

    try {
      // Upload new files first so the current documents remain available
      // if the replacement fails before updating the database.
      for (const key of DOCUMENT_KEYS) {
        const file = files[key]?.[0];

        if (!file) continue;

        const path = await ExternalUserDocumentsModel.uploadFile(
          validUserId,
          key,
          file
        );

        uploadedPaths.push(path);
        documentUpdates[key] = path;
      }

      const updatedDocuments = await ExternalUserDocumentsModel.updateByUserId(
        validUserId,
        documentUpdates
      );

      /*
       * Once the database points to the new files, the previous files
       * can be removed without risking the user's current documents.
       */
      const previousPaths = Object.keys(documentUpdates)
        .map((key) => currentDocuments[key])
        .filter((path) => typeof path === 'string' && path.length > 0);

      // Cleanup is best-effort because the database already points
      // to the successfully uploaded documents.
      await ExternalUserDocumentsModel.removeFiles(previousPaths).catch(
        () => {}
      );

      return await ExternalUserDocumentsModel.attachSignedUrls(
        updatedDocuments
      );
    } catch (error) {
      // Roll back only newly uploaded files if the replacement did not finish.
      await ExternalUserDocumentsModel.removeFiles(uploadedPaths).catch(
        () => {}
      );

      throw error;
    }
  }
}

export default UploadDocumentsUseCase;
