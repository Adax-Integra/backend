import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the data layer and the mailer so the use case runs without a database.
const findRolesByUserIdMock = jest.fn();
const getVerificationStatusMock = jest.fn();
const updateVerificationStatusWithLogMock = jest.fn();
const sendAccountVerifiedNoticeMock = jest.fn();
const sendVerificationRejectedNoticeMock = jest.fn();

jest.unstable_mockModule('../Data/Models/role.model.js', () => ({
  default: { findRolesByUserId: findRolesByUserIdMock },
}));

jest.unstable_mockModule('../Data/Models/user.model.js', () => ({
  default: {
    getVerificationStatus: getVerificationStatusMock,
    updateVerificationStatusWithLog: updateVerificationStatusWithLogMock,
  },
}));

jest.unstable_mockModule('../Data/Services/mailer.service.js', () => ({
  default: {
    sendAccountVerifiedNotice: sendAccountVerifiedNoticeMock,
    sendVerificationRejectedNotice: sendVerificationRejectedNoticeMock,
  },
}));

const { default: ReviewVerificationUseCase } =
  await import('../Domain/UseCases/reviewVerification.usecase.js');

const useCase = new ReviewVerificationUseCase();

const userId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';

describe('B-02: ReviewVerificationUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findRolesByUserIdMock.mockResolvedValue(['external']);
    getVerificationStatusMock.mockResolvedValue({
      user_id: userId,
      verification_status: 'EN_REVISION',
      email: 'ana@externa.com',
    });
    updateVerificationStatusWithLogMock.mockImplementation(
      async ({ status }) => ({ user_id: userId, verification_status: status })
    );
    sendAccountVerifiedNoticeMock.mockResolvedValue(undefined);
    sendVerificationRejectedNoticeMock.mockResolvedValue(undefined);
  });

  it('approves a reviewed account and notifies the external user', async () => {
    const result = await useCase.execute(actorId, userId, {
      status: 'VERIFICADO',
    });

    expect(updateVerificationStatusWithLogMock).toHaveBeenCalledWith({
      userId,
      actorId,
      status: 'VERIFICADO',
      reason: null,
    });
    expect(sendAccountVerifiedNoticeMock).toHaveBeenCalledWith(
      'ana@externa.com'
    );
    expect(sendVerificationRejectedNoticeMock).not.toHaveBeenCalled();
    expect(result.verification_status).toBe('VERIFICADO');
  });

  it('rejects a reviewed account with a reason and notifies the external user', async () => {
    await useCase.execute(actorId, userId, {
      status: 'NO_VERIFICADO',
      reason: 'El comprobante no es legible',
    });

    expect(updateVerificationStatusWithLogMock).toHaveBeenCalledWith({
      userId,
      actorId,
      status: 'NO_VERIFICADO',
      reason: 'El comprobante no es legible',
    });
    expect(sendVerificationRejectedNoticeMock).toHaveBeenCalledWith(
      'ana@externa.com',
      'El comprobante no es legible'
    );
    expect(sendAccountVerifiedNoticeMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid status (400)', async () => {
    await expect(
      useCase.execute(actorId, userId, { status: 'EN_SEGUIMIENTO' })
    ).rejects.toMatchObject({ status: 400 });

    expect(updateVerificationStatusWithLogMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the target is not an external account', async () => {
    findRolesByUserIdMock.mockResolvedValue(['internal']);

    await expect(
      useCase.execute(actorId, userId, { status: 'VERIFICADO' })
    ).rejects.toMatchObject({ status: 404 });

    expect(getVerificationStatusMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the external user does not exist', async () => {
    getVerificationStatusMock.mockResolvedValue(null);

    await expect(
      useCase.execute(actorId, userId, { status: 'VERIFICADO' })
    ).rejects.toMatchObject({ status: 404 });

    expect(updateVerificationStatusWithLogMock).not.toHaveBeenCalled();
  });

  it('returns 409 when the account is not under review', async () => {
    getVerificationStatusMock.mockResolvedValue({
      user_id: userId,
      verification_status: 'NO_VERIFICADO',
      email: 'ana@externa.com',
    });

    await expect(
      useCase.execute(actorId, userId, { status: 'VERIFICADO' })
    ).rejects.toMatchObject({ status: 409 });

    expect(updateVerificationStatusWithLogMock).not.toHaveBeenCalled();
  });

  it('keeps the decision saved even if the email fails', async () => {
    sendAccountVerifiedNoticeMock.mockRejectedValue(new Error('smtp down'));

    const result = await useCase.execute(actorId, userId, {
      status: 'VERIFICADO',
    });

    expect(updateVerificationStatusWithLogMock).toHaveBeenCalledTimes(1);
    expect(result.verification_status).toBe('VERIFICADO');
  });
});
