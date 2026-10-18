import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';
import DocumentLinkService from '../../Data/Services/documentLink.service.js';

function notFoundError() {
  const error = new Error('Document not found.');
  error.status = 404;
  return error;
}

/*
R-06 / V-13: opens a document link. The token was created by
attachSignedUrls for a user that already passed ownDataOnly (R-06) or
adminInternalOnly (V-13), so the token is the permission.
*/
class GetDocumentFileUseCase {
  async execute(token) {
    const { userId, field, pathHash } = DocumentLinkService.verify(token);

    const documents = await ExternalUserDocumentsModel.findByUserId(userId);
    const storagePath = documents?.[field];

    // The document was deleted or replaced after the link was created
    if (!DocumentLinkService.matchesPath(pathHash, storagePath)) {
      throw notFoundError();
    }

    return ExternalUserDocumentsModel.downloadFile(storagePath);
  }
}

export default GetDocumentFileUseCase;
