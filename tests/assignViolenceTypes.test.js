import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the case model to avoid real database operations.
const caseModelMock = {
  assignViolenceTypes: jest.fn(),
};

jest.unstable_mockModule('../Data/Models/case.model.js', () => ({
  default: caseModelMock,
}));

const { default: AssignViolenceTypesUseCase } =
  await import('../Domain/UseCases/assignViolenceTypes.usecase.js');

const caseId = '123e4567-e89b-42d3-a456-426614174000';
const violenceId = '223e4567-e89b-42d3-a456-426614174001';

describe('R-07: assign violence types', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should reject an invalid case ID', async () => {
    const useCase = new AssignViolenceTypesUseCase();

    await expect(useCase.execute('invalid-id', [violenceId])).rejects.toThrow();

    expect(caseModelMock.assignViolenceTypes).not.toHaveBeenCalled();
  });

  it('should reject a non-array value', async () => {
    const useCase = new AssignViolenceTypesUseCase();

    await expect(useCase.execute(caseId, 'invalid')).rejects.toThrow(
      'violenceIds must be an array.'
    );

    expect(caseModelMock.assignViolenceTypes).not.toHaveBeenCalled();
  });

  it('should reject an invalid violence ID', async () => {
    const useCase = new AssignViolenceTypesUseCase();

    await expect(useCase.execute(caseId, ['invalid-id'])).rejects.toThrow();

    expect(caseModelMock.assignViolenceTypes).not.toHaveBeenCalled();
  });

  it('should reject duplicate violence types', async () => {
    const useCase = new AssignViolenceTypesUseCase();

    await expect(
      useCase.execute(caseId, [violenceId, violenceId])
    ).rejects.toThrow('Duplicate violence types are not allowed.');

    expect(caseModelMock.assignViolenceTypes).not.toHaveBeenCalled();
  });

  it('should allow removing all assignments', async () => {
    const useCase = new AssignViolenceTypesUseCase();

    caseModelMock.assignViolenceTypes.mockResolvedValue({
      caseId,
      violenceIds: [],
    });

    const result = await useCase.execute(caseId, []);

    expect(caseModelMock.assignViolenceTypes).toHaveBeenCalledWith(caseId, []);

    expect(result).toEqual({
      caseId,
      violenceIds: [],
    });
  });

  it('should assign valid violence types', async () => {
    const useCase = new AssignViolenceTypesUseCase();

    caseModelMock.assignViolenceTypes.mockResolvedValue({
      caseId,
      violenceIds: [violenceId],
    });

    const result = await useCase.execute(caseId, [violenceId]);

    expect(caseModelMock.assignViolenceTypes).toHaveBeenCalledWith(caseId, [
      violenceId,
    ]);

    expect(result).toEqual({
      caseId,
      violenceIds: [violenceId],
    });
  });
});
