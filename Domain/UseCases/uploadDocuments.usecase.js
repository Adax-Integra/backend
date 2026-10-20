import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';
import validIdValidator from '../../Data/Validators/validId.validator.js';
import UserModel from '../../Data/Models/user.model.js';

const DOCUMENT_KEYS = ['identity_document', 'proof_of_address'];

class UploadDocumentsUseCase {
  async execute(userId, files = {}, baseUrl) {
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
    let updatedDocuments;

    try {
      /*
      Upload new files first so the current documents remain available
      if the replacement fails before updating the database.
      */
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

      updatedDocuments = await ExternalUserDocumentsModel.updateByUserId(
        validUserId,
        documentUpdates
      );
    } catch (error) {
      // Roll back only newly uploaded files if the replacement did not finish.
      await ExternalUserDocumentsModel.removeFiles(uploadedPaths).catch(
        () => {}
      );

      throw error;
    }

    /*
    From here the database points to the new files, so a failure below
    must never remove them. The previous files can be removed without
    risking the user's current documents.
     */
    const previousPaths = Object.keys(documentUpdates)
      .map((key) => currentDocuments[key])
      .filter((path) => typeof path === 'string' && path.length > 0);

    /*
    Cleanup is best-effort because the database already points
    to the successfully uploaded documents.
    */
    await ExternalUserDocumentsModel.removeFiles(previousPaths).catch(() => {});

    try {
      const hasIdentity =
        typeof updatedDocuments.identity_document === 'string' &&
        updatedDocuments.identity_document.length > 0;

      const hasProof =
        typeof updatedDocuments.proof_of_address === 'string' &&
        updatedDocuments.proof_of_address.length > 0;

      if (hasIdentity && hasProof) {
        const current = await UserModel.getVerificationStatus(validUserId);

        if (current?.verification_status === 'NO_VERIFICADO') {
          await UserModel.updateVerificationStatus(validUserId, 'EN_REVISION');
        }
      }
    } catch {
      // Keep the upload successful even if the status flip fails.
    }

    return ExternalUserDocumentsModel.attachSignedUrls(
      updatedDocuments,
      baseUrl
    );
  }
}

export default UploadDocumentsUseCase;
