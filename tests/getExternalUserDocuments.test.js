import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the models to avoid accessing real Supabase data.
const roleModelMock = {
  findRolesByUserId: jest.fn(),
};

const documentsModelMock = {
  findByUserId: jest.fn(),
  attachSignedUrls: jest.fn(),
};

jest.unstable_mockModule('../Data/Models/role.model.js', () => ({
  default: roleModelMock,
}));

jest.unstable_mockModule(
  '../Data/Models/externalUserDocuments.model.js',
  () => ({
    default: documentsModelMock,
  })
);

const { default: GetExternalUserDocumentsUseCase } =
  await import('../Domain/UseCases/getExternalUserDocuments.usecase.js');

const userId = '123e4567-e89b-42d3-a456-426614174000';

describe('V-13: get external user documents', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should reject an invalid userId without querying the database', async () => {
    const useCase = new GetExternalUserDocumentsUseCase();

    await expect(useCase.execute('not-a-uuid')).rejects.toMatchObject({
      status: 400,
    });

    expect(roleModelMock.findRolesByUserId).not.toHaveBeenCalled();
    expect(documentsModelMock.findByUserId).not.toHaveBeenCalled();
  });

  it('should return 404 when the account is not an external user', async () => {
    roleModelMock.findRolesByUserId.mockResolvedValue(['internal']);

    const useCase = new GetExternalUserDocumentsUseCase();

    await expect(useCase.execute(userId)).rejects.toMatchObject({
      status: 404,
      message: 'External user not found',
    });

    // Documents of internal users must never be read.
    expect(documentsModelMock.findByUserId).not.toHaveBeenCalled();
  });

  it('should return both documents as null when nothing was uploaded', async () => {
    roleModelMock.findRolesByUserId.mockResolvedValue(['external']);
    documentsModelMock.findByUserId.mockResolvedValue(null);
    documentsModelMock.attachSignedUrls.mockResolvedValue(null);

    const useCase = new GetExternalUserDocumentsUseCase();
    const result = await useCase.execute(userId);

    expect(result).toEqual({
      user_id: userId,
      identity_document: null,
      proof_of_address: null,
    });
  });

  it('should return signed URLs and file types without storage paths', async () => {
    roleModelMock.findRolesByUserId.mockResolvedValue(['external']);
    documentsModelMock.findByUserId.mockResolvedValue({
      document_id: 'doc-1',
      identity_document: `${userId}/identity/abc.jpg`,
      proof_of_address: `${userId}/address/def.pdf`,
    });
    documentsModelMock.attachSignedUrls.mockResolvedValue({
      document_id: 'doc-1',
      identity_document_url: 'https://signed/identity',
      proof_of_address_url: 'https://signed/address',
    });

    const useCase = new GetExternalUserDocumentsUseCase();
    const result = await useCase.execute(userId);

    expect(result.identity_document).toEqual({
      url: 'https://signed/identity',
      file_type: 'image',
    });
    expect(result.proof_of_address).toEqual({
      url: 'https://signed/address',
      file_type: 'pdf',
    });

    // The bucket paths must not be part of the result.
    expect(JSON.stringify(result)).not.toContain(`${userId}/identity`);
    expect(JSON.stringify(result)).not.toContain(`${userId}/address`);
  });

  it('should keep the file type when storage could not sign the URL', async () => {
    roleModelMock.findRolesByUserId.mockResolvedValue(['external']);
    documentsModelMock.findByUserId.mockResolvedValue({
      identity_document: `${userId}/identity/abc.png`,
      proof_of_address: null,
    });
    documentsModelMock.attachSignedUrls.mockResolvedValue({
      identity_document_url: null,
      proof_of_address_url: null,
    });

    const useCase = new GetExternalUserDocumentsUseCase();
    const result = await useCase.execute(userId);

    expect(result.identity_document).toEqual({ url: null, file_type: 'image' });
    expect(result.proof_of_address).toBeNull();
  });
});
