import { jest, describe, it, expect } from '@jest/globals';

// Mock the shared document model to avoid accessing real Supabase data.
const documentsModelMock = {
  findByUserId: jest.fn(),
  uploadFile: jest.fn(),
  updateByUserId: jest.fn(),
  removeFiles: jest.fn(),
  attachSignedUrls: jest.fn(),
};

jest.unstable_mockModule(
  '../Data/Models/externalUserDocuments.model.js',
  () => ({
    default: documentsModelMock,
  })
);

const { default: UploadDocumentsUseCase } =
  await import('../Domain/UseCases/uploadDocuments.usecase.js');

describe('R-06: upload documents', () => {
  it('should reject a request without files', async () => {
    jest.resetAllMocks();

    const useCase = new UploadDocumentsUseCase();
    const userId = '123e4567-e89b-42d3-a456-426614174000';

    await expect(useCase.execute(userId, {})).rejects.toThrow(
      'At least one document is required.'
    );

    // No database or storage operations should be executed.
    expect(documentsModelMock.findByUserId).not.toHaveBeenCalled();
    expect(documentsModelMock.uploadFile).not.toHaveBeenCalled();
  });

  it('should replace only the identity document', async () => {
    jest.resetAllMocks();

    const userId = '123e4567-e89b-42d3-a456-426614174000';

    const oldPath = `${userId}/identity/old.pdf`;
    const newPath = `${userId}/identity/new.pdf`;
    const addressPath = `${userId}/address/current.pdf`;

    const file = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('test document'),
    };

    // Simulate the documents currently stored for the user.
    documentsModelMock.findByUserId.mockResolvedValue({
      identity_document: oldPath,
      proof_of_address: addressPath,
    });

    // Simulate a successful upload to Supabase Storage.
    documentsModelMock.uploadFile.mockResolvedValue(newPath);

    // Simulate updating the document path in the database.
    documentsModelMock.updateByUserId.mockResolvedValue({
      identity_document: newPath,
      proof_of_address: addressPath,
    });

    documentsModelMock.removeFiles.mockResolvedValue();

    documentsModelMock.attachSignedUrls.mockResolvedValue({
      identity_document_url: 'https://example.com/identity',
    });

    const useCase = new UploadDocumentsUseCase();

    await useCase.execute(userId, {
      identity_document: [file],
    });

    // Verify that the new identity document was uploaded.
    expect(documentsModelMock.uploadFile).toHaveBeenCalledWith(
      userId,
      'identity_document',
      file
    );

    // Only the identity document path should be updated.
    expect(documentsModelMock.updateByUserId).toHaveBeenCalledWith(userId, {
      identity_document: newPath,
    });

    // Only the previous identity document should be removed.
    expect(documentsModelMock.removeFiles).toHaveBeenCalledWith([oldPath]);

    // The address document must remain untouched.
    expect(documentsModelMock.removeFiles).not.toHaveBeenCalledWith([
      addressPath,
    ]);
  });

  it('should remove the new file if the database update fails', async () => {
    jest.resetAllMocks();

    const userId = '123e4567-e89b-42d3-a456-426614174000';

    const oldPath = `${userId}/identity/old.pdf`;
    const newPath = `${userId}/identity/new.pdf`;

    const file = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('test document'),
    };

    // Simulate an existing document.
    documentsModelMock.findByUserId.mockResolvedValue({
      identity_document: oldPath,
    });

    // Simulate a successful upload.
    documentsModelMock.uploadFile.mockResolvedValue(newPath);

    // Simulate a database failure after uploading the new file.
    documentsModelMock.updateByUserId.mockRejectedValue(
      new Error('Database update failed.')
    );

    documentsModelMock.removeFiles.mockResolvedValue();

    const useCase = new UploadDocumentsUseCase();

    await expect(
      useCase.execute(userId, {
        identity_document: [file],
      })
    ).rejects.toThrow('Database update failed.');

    // Roll back the new upload, not the existing document.
    expect(documentsModelMock.removeFiles).toHaveBeenCalledWith([newPath]);

    expect(documentsModelMock.removeFiles).not.toHaveBeenCalledWith([oldPath]);

    // No signed URLs should be generated after the failure.
    expect(documentsModelMock.attachSignedUrls).not.toHaveBeenCalled();
  });
});
