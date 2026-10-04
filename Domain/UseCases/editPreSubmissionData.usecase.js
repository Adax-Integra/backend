import ExternalUserModel from '../../Data/Models/externalUser.model.js';
import AddressModel from '../../Data/Models/address.model.js';
import ExternalUserDocumentsModel from '../../Data/Models/externalUserDocuments.model.js';
import EditPreSubmissionValidator from '../../Data/Validators/editPreSubmission.validator.js';
import validIdValidator from '../../Data/Validators/validId.validator.js';

const DOCUMENT_KEYS = ['identity_document', 'proof_of_address'];

class EditPreSubmissionDataUseCase {
  // Files comes from multer's req.files: { identity_document: [file], ... }
  async execute(userId, updateData, files = {}) {
    const validUserId = validIdValidator.validateId(userId);
    const uploadedPaths = [];

    try {
      // Upload first then the uploaded path replaces any path sent in the body
      let body = updateData;
      for (const key of DOCUMENT_KEYS) {
        const file = files[key]?.[0];
        if (!file) continue;

        const path = await ExternalUserDocumentsModel.uploadFile(
          validUserId,
          key,
          file
        );
        uploadedPaths.push(path);
        body = { ...body, documents: { ...body?.documents, [key]: path } };
      }

      const { profile, address, documents } =
        EditPreSubmissionValidator.validateUpdateBody(body, validUserId);

      // Only check paths sent in the body; the uploaded ones already exist
      const missingDocuments = (
        await Promise.all(
          Object.entries(documents)
            .filter(([, path]) => !uploadedPaths.includes(path))
            .map(async ([key, path]) =>
              (await ExternalUserDocumentsModel.pathExists(path)) ? null : key
            )
        )
      ).filter(Boolean);

      if (missingDocuments.length > 0) {
        throw new Error(
          missingDocuments
            .map((key) => `documents.${key}: file not found in storage.`)
            .join(' ')
        );
      }

      const result = {
        user_id: validUserId,
        profile: null,
        address: null,
        documents: null,
      };

      if (Object.keys(profile).length > 0) {
        result.profile = await ExternalUserModel.updateProfile(
          validUserId,
          profile
        );
      } else {
        result.profile = await ExternalUserModel.findProfileById(validUserId);
      }

      if (Object.keys(address).length > 0) {
        result.address = await AddressModel.updateByUserId(
          validUserId,
          address
        );
      } else {
        result.address = await AddressModel.findByUserId(validUserId);
      }

      if (Object.keys(documents).length > 0) {
        result.documents = await ExternalUserDocumentsModel.updateByUserId(
          validUserId,
          documents
        );
      } else {
        result.documents =
          await ExternalUserDocumentsModel.findByUserId(validUserId);
      }

      result.documents = await ExternalUserDocumentsModel.attachSignedUrls(
        result.documents
      );

      return result;
    } catch (error) {
      // Don't upload files if anything failed after uploading
      await ExternalUserDocumentsModel.removeFiles(uploadedPaths).catch(
        () => {}
      );
      throw error;
    }
  }
}

export default EditPreSubmissionDataUseCase;
