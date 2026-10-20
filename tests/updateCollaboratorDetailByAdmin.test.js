import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// 1. Prepare Mocks to prevent touching the real database
const findRolesByUserIdMock = jest.fn();
const findEditableProfileByIdMock = jest.fn();
const findByEmailMock = jest.fn();
const updateProfileWithLogMock = jest.fn();
const updatePhoneMock = jest.fn();
const sendProfileUpdatedNoticeMock = jest.fn();

// 2. Intercept the imports to inject our mocks
jest.unstable_mockModule('../Data/Models/role.model.js', () => ({
  default: { findRolesByUserId: findRolesByUserIdMock },
}));

jest.unstable_mockModule('../Data/Models/internalUser.model.js', () => ({
  default: {
    findEditableProfileById: findEditableProfileByIdMock,
    findByEmail: findByEmailMock,
    updateProfileWithLog: updateProfileWithLogMock,
    updatePhone: updatePhoneMock,
  },
}));

jest.unstable_mockModule('../Data/Services/mailer.service.js', () => ({
  default: { sendProfileUpdatedNotice: sendProfileUpdatedNoticeMock },
}));

// 3. Import the use case AFTER defining the mocks
const { default: UpdateCollaboratorProfileUseCase } =
  await import('../Domain/UseCases/updateCollaboratorProfile.usecase.js');

const useCase = new UpdateCollaboratorProfileUseCase();

// Real IDs from the database
const userId = '01180ea4-bdb9-48f4-b3dd-3868e09cf211'; // Internal User: Veronica López
const actorId = '189fa09d-05cd-4b35-961d-3b523f33cd3c'; // Admin User

// Mock data formatted to pass the strict validator (+52 and no spaces)
const currentProfile = {
  user_id: userId,
  name: 'Veronica',
  last_name: 'López',
  email: 'denisse@mf.tec.mx',
  phone: '+524432564978',
};

describe('Unit tests for the edit collaborator HU (G-11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configure default successful responses
    findRolesByUserIdMock.mockResolvedValue(['internal']);
    findEditableProfileByIdMock.mockResolvedValue({ ...currentProfile });
    findByEmailMock.mockResolvedValue(null);

    updateProfileWithLogMock.mockImplementation(async ({ profile }) => ({
      ...currentProfile,
      ...profile,
    }));

    updatePhoneMock.mockImplementation(async (id, phone) => phone);

    sendProfileUpdatedNoticeMock.mockResolvedValue(undefined);
  });

  describe('Successful updates', () => {
    it('Should update only the phone', async () => {
      const newPhone = '+524423216969';
      const result = await useCase.execute(actorId, userId, {
        profile: { phone: newPhone },
      });

      expect(updatePhoneMock).toHaveBeenCalledTimes(1);
      expect(updatePhoneMock).toHaveBeenCalledWith(userId, newPhone);

      expect(sendProfileUpdatedNoticeMock).toHaveBeenCalledTimes(1);
      expect(sendProfileUpdatedNoticeMock).toHaveBeenCalledWith(
        currentProfile.email
      );
      expect(result.phone).toBe(newPhone);
    });

    it('Should update name and last name correctly', async () => {
      const result = await useCase.execute(actorId, userId, {
        profile: { name: 'Braziña', last_name: 'setesientossetentaysiete' },
      });

      expect(updateProfileWithLogMock).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Braziña');
      expect(result.last_name).toBe('setesientossetentaysiete');
    });

    it('Should update the email and notify BOTH the old and new inbox', async () => {
      const newEmail = 'we@wewewe.com';

      await useCase.execute(actorId, userId, {
        profile: { email: newEmail },
      });

      expect(findByEmailMock).toHaveBeenCalledWith(newEmail);
      expect(sendProfileUpdatedNoticeMock).toHaveBeenCalledTimes(2);
      expect(sendProfileUpdatedNoticeMock).toHaveBeenNthCalledWith(
        1,
        currentProfile.email
      );
      expect(sendProfileUpdatedNoticeMock).toHaveBeenNthCalledWith(2, newEmail);
    });
  });

  describe('Expected Errors', () => {
    it('Should throw 400 when the submitted data has no changes', async () => {
      await expect(
        useCase.execute(actorId, userId, {
          profile: { name: currentProfile.name, phone: currentProfile.phone },
        })
      ).rejects.toThrow('The submitted data has no changes');

      expect(updateProfileWithLogMock).not.toHaveBeenCalled();
      expect(updatePhoneMock).not.toHaveBeenCalled(); // Verificamos que no intentó actualizar
      expect(sendProfileUpdatedNoticeMock).not.toHaveBeenCalled();
    });

    it('Should throw 409 when the new email belongs to another account', async () => {
      findByEmailMock.mockResolvedValue({ user_id: 'another-user-id' });

      await expect(
        useCase.execute(actorId, userId, {
          profile: { email: 'mbajos@gmail.com' },
        })
      ).rejects.toThrow('This email is already registered');

      expect(updateProfileWithLogMock).not.toHaveBeenCalled();
    });

    it('Should throw 404 when the account is not a collaborator (admin/external)', async () => {
      findRolesByUserIdMock.mockResolvedValue(['admin']);

      await expect(
        useCase.execute(actorId, userId, {
          profile: { phone: '+524425072103' },
        })
      ).rejects.toMatchObject({ status: 404 });

      expect(findEditableProfileByIdMock).not.toHaveBeenCalled();
    });

    it('Should throw 404 when the collaborator does not exist', async () => {
      findEditableProfileByIdMock.mockResolvedValue(null);

      await expect(
        useCase.execute(actorId, userId, { profile: { name: 'Nuevo Nombre' } })
      ).rejects.toMatchObject({ status: 404 });

      expect(updateProfileWithLogMock).not.toHaveBeenCalled();
    });
  });
});
