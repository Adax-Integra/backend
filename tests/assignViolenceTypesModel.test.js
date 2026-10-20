import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase to avoid accessing the real database.
const supabaseMock = {
  from: jest.fn(),
};

jest.unstable_mockModule('../Data/Config/supabase.js', () => ({
  supabase: supabaseMock,
}));

const { default: CaseModel } = await import('../Data/Models/case.model.js');

const caseId = '123e4567-e89b-42d3-a456-426614174000';
const violenceId = '223e4567-e89b-42d3-a456-426614174001';

// Simulate database queries used by R-07.
const mockDatabase = ({
  caseFound = true,
  caseState = 'Open',
  activeIds = [violenceId],
  severity = 8,
  existing = [],
  upsertError = null,
} = {}) => {
  const caseQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: caseFound ? { case_id: caseId, state: caseState } : null,
      error: null,
    }),
  };

  const typesQuery = {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockResolvedValue({
      data: activeIds.map((id) => ({ violence_id: id, severity })),
      error: null,
    }),
  };

  const relationsQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({
      data: existing,
      error: null,
    }),
    upsert: jest.fn().mockResolvedValue({
      error: upsertError,
    }),
  };

  supabaseMock.from.mockImplementation((table) => {
    if (table === 'case') return caseQuery;
    if (table === 'violence_types') return typesQuery;
    if (table === 'case_violence') return relationsQuery;

    throw new Error(`Unexpected table: ${table}`);
  });

  return { caseQuery, typesQuery, relationsQuery };
};

describe('R-07: violence types persistence', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should insert a new violence assignment', async () => {
    const { relationsQuery } = mockDatabase();

    const result = await CaseModel.assignViolenceTypes(caseId, [violenceId]);

    expect(relationsQuery.upsert).toHaveBeenCalledWith(
      [
        {
          case_id: caseId,
          violence_id: violenceId,
          deleted_at: null,
          updated_at: expect.any(String),
        },
      ],
      { onConflict: 'case_id,violence_id' }
    );

    expect(result).toEqual({
      caseId,
      violenceIds: [violenceId],
      severity: 8,
      urgency: 'Alta',
    });
  });

  it('should reactivate a deleted assignment', async () => {
    const { relationsQuery } = mockDatabase({
      existing: [
        {
          violence_id: violenceId,
          deleted_at: '2026-10-01T12:00:00.000Z',
        },
      ],
    });

    await CaseModel.assignViolenceTypes(caseId, [violenceId]);

    expect(relationsQuery.upsert).toHaveBeenCalledWith(
      [
        {
          case_id: caseId,
          violence_id: violenceId,
          deleted_at: null,
          updated_at: expect.any(String),
        },
      ],
      { onConflict: 'case_id,violence_id' }
    );
  });

  it('should soft delete an unselected assignment', async () => {
    const { relationsQuery, typesQuery } = mockDatabase({
      existing: [
        {
          violence_id: violenceId,
          deleted_at: null,
        },
      ],
    });

    await CaseModel.assignViolenceTypes(caseId, []);

    expect(relationsQuery.upsert).toHaveBeenCalledWith(
      [
        {
          case_id: caseId,
          violence_id: violenceId,
          deleted_at: expect.any(String),
          updated_at: expect.any(String),
        },
      ],
      { onConflict: 'case_id,violence_id' }
    );

    expect(typesQuery.select).not.toHaveBeenCalled();
  });

  it('should avoid writes when assignments are unchanged', async () => {
    const { relationsQuery } = mockDatabase({
      existing: [
        {
          violence_id: violenceId,
          deleted_at: null,
        },
      ],
    });

    const result = await CaseModel.assignViolenceTypes(caseId, [violenceId]);

    expect(relationsQuery.upsert).not.toHaveBeenCalled();

    expect(result).toEqual({
      caseId,
      violenceIds: [violenceId],
      severity: 8,
      urgency: 'Alta',
    });
  });

  it('should reject a case that does not exist', async () => {
    const { relationsQuery } = mockDatabase({
      caseFound: false,
    });

    await expect(
      CaseModel.assignViolenceTypes(caseId, [violenceId])
    ).rejects.toThrow('Case not found.');

    expect(relationsQuery.upsert).not.toHaveBeenCalled();
  });

  it('should reject unknown or inactive violence types', async () => {
    const { relationsQuery } = mockDatabase({
      activeIds: [],
    });

    await expect(
      CaseModel.assignViolenceTypes(caseId, [violenceId])
    ).rejects.toThrow('Unknown or inactive violence type.');

    expect(relationsQuery.upsert).not.toHaveBeenCalled();
  });

  it('should report an upsert failure', async () => {
    const { relationsQuery } = mockDatabase({
      upsertError: {
        message: 'Database update failed.',
      },
    });

    await expect(
      CaseModel.assignViolenceTypes(caseId, [violenceId])
    ).rejects.toThrow('Database update failed.');

    expect(relationsQuery.upsert).toHaveBeenCalledTimes(1);
  });

  it('should reject a closed case', async () => {
    const { relationsQuery, typesQuery } = mockDatabase({
      caseState: 'Closed',
    });

    await expect(
      CaseModel.assignViolenceTypes(caseId, [violenceId])
    ).rejects.toMatchObject({ status: 409, code: 'CASE_CLOSED' });

    expect(typesQuery.select).not.toHaveBeenCalled();
    expect(relationsQuery.upsert).not.toHaveBeenCalled();
  });

  it('should return Media urgency for a severity between 4 and 7', async () => {
    mockDatabase({ severity: 6 });

    const result = await CaseModel.assignViolenceTypes(caseId, [violenceId]);

    expect(result).toMatchObject({ severity: 6, urgency: 'Media' });
  });

  it('should return Sin evaluar when every violence type is removed', async () => {
    mockDatabase();

    const result = await CaseModel.assignViolenceTypes(caseId, []);

    expect(result).toEqual({
      caseId,
      violenceIds: [],
      severity: null,
      urgency: 'Sin evaluar',
    });
  });

  it('should send error codes for a missing case and unknown types', async () => {
    mockDatabase({ caseFound: false });

    await expect(
      CaseModel.assignViolenceTypes(caseId, [violenceId])
    ).rejects.toMatchObject({ status: 404, code: 'CASE_NOT_FOUND' });

    mockDatabase({ activeIds: [] });

    await expect(
      CaseModel.assignViolenceTypes(caseId, [violenceId])
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_VIOLENCE_TYPE' });
  });
});
