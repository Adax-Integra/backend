import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock both models so the UseCase runs without Supabase.
const documentsModelMock = {
  findByUserId: jest.fn(),
  uploadFile: jest.fn(),
  updateByUserId: jest.fn(),
  removeFiles: jest.fn(),
  attachSignedUrls: jest.fn(),
};

const userModelMock = {
  getVerificationStatus: jest.fn(),
  updateVerificationStatus: jest.fn(),
};

jest.unstable_mockModule(
  '../Data/Models/externalUserDocuments.model.js',
  () => ({ default: documentsModelMock })
);

jest.unstable_mockModule('../Data/Models/user.model.js', () => ({
  default: userModelMock,
}));

const { default: UploadDocumentsUseCase } =
  await import('../Domain/UseCases/uploadDocuments.usecase.js');

const userId = '123e4567-e89b-42d3-a456-426614174000';
const identityPath = `${userId}/identity/ine.pdf`;
const addressPath = `${userId}/address/proof.pdf`;
const file = { mimetype: 'application/pdf', buffer: Buffer.from('doc') };

describe('B-01: identity verification status on document upload', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    documentsModelMock.removeFiles.mockResolvedValue();
    documentsModelMock.attachSignedUrls.mockResolvedValue({});
  });

  it('moves the account to EN_REVISION when both documents are present and status is NO_VERIFICADO', async () => {
    documentsModelMock.findByUserId.mockResolvedValue({
      identity_document: null,
      proof_of_address: addressPath,
    });
    documentsModelMock.uploadFile.mockResolvedValue(identityPath);
    documentsModelMock.updateByUserId.mockResolvedValue({
      identity_document: identityPath,
      proof_of_address: addressPath,
    });
    userModelMock.getVerificationStatus.mockResolvedValue({
      verification_status: 'NO_VERIFICADO',
    });

    await new UploadDocumentsUseCase().execute(userId, {
      identity_document: [file],
    });

    expect(userModelMock.updateVerificationStatus).toHaveBeenCalledWith(
      userId,
      'EN_REVISION'
    );
  });

  it('does NOT change the status when only one document is present', async () => {
    documentsModelMock.findByUserId.mockResolvedValue({
      identity_document: null,
      proof_of_address: null,
    });
    documentsModelMock.uploadFile.mockResolvedValue(identityPath);
    documentsModelMock.updateByUserId.mockResolvedValue({
      identity_document: identityPath,
      proof_of_address: null,
    });

    await new UploadDocumentsUseCase().execute(userId, {
      identity_document: [file],
    });

    expect(userModelMock.getVerificationStatus).not.toHaveBeenCalled();
    expect(userModelMock.updateVerificationStatus).not.toHaveBeenCalled();
  });

  it('does NOT regress the status when it is already EN_REVISION', async () => {
    documentsModelMock.findByUserId.mockResolvedValue({
      identity_document: `${userId}/identity/old.pdf`,
      proof_of_address: addressPath,
    });
    documentsModelMock.uploadFile.mockResolvedValue(identityPath);
    documentsModelMock.updateByUserId.mockResolvedValue({
      identity_document: identityPath,
      proof_of_address: addressPath,
    });
    userModelMock.getVerificationStatus.mockResolvedValue({
      verification_status: 'EN_REVISION',
    });

    await new UploadDocumentsUseCase().execute(userId, {
      identity_document: [file],
    });

    expect(userModelMock.updateVerificationStatus).not.toHaveBeenCalled();
  });

  it('keeps the upload successful even if the status flip fails', async () => {
    documentsModelMock.findByUserId.mockResolvedValue({
      identity_document: null,
      proof_of_address: addressPath,
    });
    documentsModelMock.uploadFile.mockResolvedValue(identityPath);
    documentsModelMock.updateByUserId.mockResolvedValue({
      identity_document: identityPath,
      proof_of_address: addressPath,
    });
    userModelMock.getVerificationStatus.mockRejectedValue(new Error('db down'));
    documentsModelMock.attachSignedUrls.mockResolvedValue({
      identity_document_url: 'https://x',
    });

    const result = await new UploadDocumentsUseCase().execute(userId, {
      identity_document: [file],
    });

    expect(result).toEqual({ identity_document_url: 'https://x' });
    expect(documentsModelMock.attachSignedUrls).toHaveBeenCalled();
  });
});
