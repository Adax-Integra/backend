import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the data model so the UseCase runs without a database.
const recordModelMock = {
  findStatusById: jest.fn(),
  updateStatus: jest.fn(),
};

jest.unstable_mockModule('../Data/Models/record.model.js', () => ({
  default: recordModelMock,
}));

// Import the real UseCase after registering the mock.
const { default: UpdateRecordStatusUseCase } =
  await import('../Domain/UseCases/updateRecordStatus.usecase.js');

const useCase = new UpdateRecordStatusUseCase();

describe('R-09: update record status (state machine)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Valid forward transition.
  it('allows a valid forward transition (EN_REVISION -> EN_SEGUIMIENTO)', async () => {
    recordModelMock.findStatusById.mockResolvedValue({
      record_id: 'rec-1',
      status: 'EN_REVISION',
    });
    recordModelMock.updateStatus.mockResolvedValue({
      record_id: 'rec-1',
      status: 'EN_SEGUIMIENTO',
    });

    const result = await useCase.execute({
      recordId: 'rec-1',
      newStatus: 'EN_SEGUIMIENTO',
    });

    expect(result.status).toBe('EN_SEGUIMIENTO');
    expect(recordModelMock.updateStatus).toHaveBeenCalledWith(
      'rec-1',
      'EN_SEGUIMIENTO'
    );
  });

  // Allowed backward transition.
  it('allows the backward transition EN_SEGUIMIENTO -> EN_REVISION', async () => {
    recordModelMock.findStatusById.mockResolvedValue({
      record_id: 'rec-2',
      status: 'EN_SEGUIMIENTO',
    });
    recordModelMock.updateStatus.mockResolvedValue({
      record_id: 'rec-2',
      status: 'EN_REVISION',
    });

    const result = await useCase.execute({
      recordId: 'rec-2',
      newStatus: 'EN_REVISION',
    });

    expect(result.status).toBe('EN_REVISION');
    expect(recordModelMock.updateStatus).toHaveBeenCalledTimes(1);
  });

  // Invalid skip transition.
  it('rejects skipping (SIN_EMPEZAR -> COMPLETADO) with 409', async () => {
    recordModelMock.findStatusById.mockResolvedValue({
      record_id: 'rec-3',
      status: 'SIN_EMPEZAR',
    });

    await expect(
      useCase.execute({ recordId: 'rec-3', newStatus: 'COMPLETADO' })
    ).rejects.toMatchObject({ status: 409 });

    expect(recordModelMock.updateStatus).not.toHaveBeenCalled();
  });

  // COMPLETADO is terminal.
  it('rejects leaving COMPLETADO (terminal) with 409', async () => {
    recordModelMock.findStatusById.mockResolvedValue({
      record_id: 'rec-4',
      status: 'COMPLETADO',
    });

    await expect(
      useCase.execute({ recordId: 'rec-4', newStatus: 'EN_SEGUIMIENTO' })
    ).rejects.toMatchObject({ status: 409 });

    expect(recordModelMock.updateStatus).not.toHaveBeenCalled();
  });

  // Same status is not a real transition.
  it('rejects setting the same status with 409', async () => {
    recordModelMock.findStatusById.mockResolvedValue({
      record_id: 'rec-5',
      status: 'EN_REVISION',
    });

    await expect(
      useCase.execute({ recordId: 'rec-5', newStatus: 'EN_REVISION' })
    ).rejects.toMatchObject({ status: 409 });

    expect(recordModelMock.updateStatus).not.toHaveBeenCalled();
  });

  // Missing record bubbles up as 404.
  it('propagates 404 when the record does not exist', async () => {
    const notFound = new Error('Record not found');
    notFound.status = 404;
    recordModelMock.findStatusById.mockRejectedValue(notFound);

    await expect(
      useCase.execute({ recordId: 'ghost', newStatus: 'EN_REVISION' })
    ).rejects.toMatchObject({ status: 404 });

    expect(recordModelMock.updateStatus).not.toHaveBeenCalled();
  });
});
