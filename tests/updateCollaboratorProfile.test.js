import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the data layer and the mailer so the use case runs without a database.
const findRolesByUserIdMock = jest.fn();
const findEditableProfileByIdMock = jest.fn();
const findByEmailMock = jest.fn();
const updateProfileWithLogMock = jest.fn();
const sendProfileUpdatedNoticeMock = jest.fn();

jest.unstable_mockModule('../Data/Models/role.model.js', () => ({
  default: { findRolesByUserId: findRolesByUserIdMock },
}));

jest.unstable_mockModule('../Data/Models/internalUser.model.js', () => ({
  default: {
    findEditableProfileById: findEditableProfileByIdMock,
    findByEmail: findByEmailMock,
    updateProfileWithLog: updateProfileWithLogMock,
  },
}));

jest.unstable_mockModule('../Data/Services/mailer.service.js', () => ({
  default: { sendProfileUpdatedNotice: sendProfileUpdatedNoticeMock },
}));

const { default: UpdateCollaboratorProfileUseCase } =
  await import('../Domain/UseCases/updateCollaboratorProfile.usecase.js');

const useCase = new UpdateCollaboratorProfileUseCase();

// A valid UUID so the id validator passes.
const userId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';

const currentProfile = {
  user_id: userId,
  name: 'Ana',
  last_name: 'Lopez',
  email: 'ana.lopez@adax.com',
};

describe('G-18: UpdateCollaboratorProfileUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findRolesByUserIdMock.mockResolvedValue(['internal']);
    findEditableProfileByIdMock.mockResolvedValue({ ...currentProfile });
    findByEmailMock.mockResolvedValue(null);
    updateProfileWithLogMock.mockImplementation(async ({ profile }) => ({
      ...currentProfile,
      ...profile,
    }));
    sendProfileUpdatedNoticeMock.mockResolvedValue(undefined);
  });

  it('updates the name and logs only the changed field', async () => {
    const result = await useCase.execute(actorId, userId, {
      profile: { name: 'Ana Maria' },
    });

    expect(updateProfileWithLogMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileWithLogMock.mock.calls[0][0];
    expect(callArg.changes).toEqual([
      { field: 'profile.name', old: 'Ana', new: 'Ana Maria' },
    ]);
    // Name change does not touch the email, so only the current inbox is notified
    expect(sendProfileUpdatedNoticeMock).toHaveBeenCalledTimes(1);
    expect(sendProfileUpdatedNoticeMock).toHaveBeenCalledWith(
      'ana.lopez@adax.com'
    );
    expect(result.name).toBe('Ana Maria');
  });

  it('notifies the old and the new inbox when the email changes', async () => {
    await useCase.execute(actorId, userId, {
      profile: { email: 'ana.nueva@adax.com' },
    });

    expect(findByEmailMock).toHaveBeenCalledWith('ana.nueva@adax.com');
    expect(sendProfileUpdatedNoticeMock).toHaveBeenCalledTimes(2);
    expect(sendProfileUpdatedNoticeMock).toHaveBeenNthCalledWith(
      1,
      'ana.lopez@adax.com'
    );
    expect(sendProfileUpdatedNoticeMock).toHaveBeenNthCalledWith(
      2,
      'ana.nueva@adax.com'
    );
  });

  it('rejects an email already used by another account (409)', async () => {
    findByEmailMock.mockResolvedValue({ user_id: 'another-user' });

    await expect(
      useCase.execute(actorId, userId, {
        profile: { email: 'taken@adax.com' },
      })
    ).rejects.toMatchObject({ status: 409 });

    expect(updateProfileWithLogMock).not.toHaveBeenCalled();
  });

  it('rejects when nothing actually changed (400)', async () => {
    await expect(
      useCase.execute(actorId, userId, {
        profile: { name: 'Ana', email: 'ana.lopez@adax.com' },
      })
    ).rejects.toMatchObject({ status: 400 });

    expect(updateProfileWithLogMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the target is not an internal account', async () => {
    findRolesByUserIdMock.mockResolvedValue(['external']);

    await expect(
      useCase.execute(actorId, userId, { profile: { name: 'Ana Maria' } })
    ).rejects.toMatchObject({ status: 404 });

    expect(findEditableProfileByIdMock).not.toHaveBeenCalled();
    expect(updateProfileWithLogMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the collaborator does not exist', async () => {
    findEditableProfileByIdMock.mockResolvedValue(null);

    await expect(
      useCase.execute(actorId, userId, { profile: { name: 'Ana Maria' } })
    ).rejects.toMatchObject({ status: 404 });

    expect(updateProfileWithLogMock).not.toHaveBeenCalled();
  });

  it('keeps the change saved even if the email notice fails', async () => {
    sendProfileUpdatedNoticeMock.mockRejectedValue(new Error('smtp down'));

    const result = await useCase.execute(actorId, userId, {
      profile: { name: 'Ana Maria' },
    });

    expect(updateProfileWithLogMock).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Ana Maria');
  });

  it('rejects a field outside name, last name and email (400)', async () => {
    await expect(
      useCase.execute(actorId, userId, {
        profile: { phone: '5512345678' },
      })
    ).rejects.toMatchObject({ status: 400 });

    expect(updateProfileWithLogMock).not.toHaveBeenCalled();
  });
});
