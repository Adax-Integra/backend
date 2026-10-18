import UserIdValidator from '../../Data/Validators/userId.validator.js';
import RoleModel from '../../Data/Models/role.model.js';
import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';

const EXTERNAL_ROLE = 'external';

function notFoundError() {
  const error = new Error('External user not found');
  error.status = 404;
  return error;
}

//The storage path never leaves the backend, only the kind of file
// so the app knows whether to draw an image or a PDF
function fileTypeFromPath(path) {
  if (typeof path !== 'string' || path.length === 0) {
    return null;
  }

  return path.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
}

//A document without a saved path was never uploaded (null)
//A saved path without URL means the link could not be created
function buildDocument(path, url) {
  const fileType = fileTypeFromPath(path);

  if (!fileType) {
    return null;
  }

  return { url: url ?? null, file_type: fileType };
}

//V-13: an internal user opens the documents of an external user's record
class GetExternalUserDocumentsUseCase {
  async execute(userId, baseUrl) {
    const validUserId = UserIdValidator.validateUserId(userId);

    //Only external users have identity documents in their record
    const roles = await RoleModel.findRolesByUserId(validUserId);
    if (!roles.includes(EXTERNAL_ROLE)) {
      throw notFoundError();
    }

    const documents =
      await ExternalUserDocumentsModel.findByUserId(validUserId);

    //Without a row the record simply has no documents yet
    const signed = await ExternalUserDocumentsModel.attachSignedUrls(
      documents,
      baseUrl
    );

    return {
      user_id: validUserId,
      identity_document: buildDocument(
        documents?.identity_document,
        signed?.identity_document_url
      ),
      proof_of_address: buildDocument(
        documents?.proof_of_address,
        signed?.proof_of_address_url
      ),
    };
  }
}

export default GetExternalUserDocumentsUseCase;
