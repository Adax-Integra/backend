import { afterEach, describe, expect, it, jest } from '@jest/globals';

import UserModel from '../Data/Models/user.model.js';
import EmailCodeService from '../Domain/Services/emailCode.service.js';
import PasswordRecoveryUseCase from '../Domain/UseCases/passwordRecovery.usecase.js';

const useCase = new PasswordRecoveryUseCase();
const user = { user_id: 'test-user', email: 'user@example.com' };

//undo fake functions after each test
afterEach(() => {
  jest.restoreAllMocks();
});

//forgot password with email, code and generic message
describe('forgotPassword', () => {
  it('sends a code when the user exists', async () => {
    //dummy db and code service
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(user);
    const issueCode = jest
      .spyOn(EmailCodeService, 'issueCode')
      .mockResolvedValue();

    //real method
    const result = await useCase.forgotPassword('user@example.com');

    //results
    expect(issueCode).toHaveBeenCalledTimes(1);
    expect(result.message).toBe(
      'Si el correo está registrado, enviaremos un código.'
    );
  });

  it('gives the same answer but sends nothing when the user does not exist', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(null);
    const issueCode = jest
      .spyOn(EmailCodeService, 'issueCode')
      .mockResolvedValue();

    const result = await useCase.forgotPassword('nadie@example.com');

    expect(issueCode).not.toHaveBeenCalled();
    expect(result.message).toBe(
      'Si el correo está registrado, enviaremos un código.'
    );
  });
});

//password update and invalidating code
describe('resetPassword', () => {
  it('rejects a password without a special character without updating it or consuming the code', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(user);
    jest.spyOn(EmailCodeService, 'validateCode').mockResolvedValue();

    const updatePassword = jest
      .spyOn(UserModel, 'updatePassword')
      .mockResolvedValue(user);

    const removeCode = jest
      .spyOn(EmailCodeService, 'removeCode')
      .mockResolvedValue();

    await expect(
      useCase.resetPassword('user@example.com', '123456', 'newPassword123')
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'La contraseña debe contener al menos un carácter especial.',
    });

    expect(updatePassword).not.toHaveBeenCalled();
    expect(removeCode).not.toHaveBeenCalled();
  });

  it('updates the password and removes the code when the code is valid', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(user);
    jest.spyOn(EmailCodeService, 'validateCode').mockResolvedValue();
    const updatePassword = jest
      .spyOn(UserModel, 'updatePassword')
      .mockResolvedValue(user);
    const removeCode = jest
      .spyOn(EmailCodeService, 'removeCode')
      .mockResolvedValue();

    const result = await useCase.resetPassword(
      'usuaria@example.com',
      '123456',
      'newPassword123!'
    );

    expect(updatePassword).toHaveBeenCalledTimes(1);
    expect(removeCode).toHaveBeenCalledTimes(1);
    expect(result.message).toBe('Contraseña actualizada exitosamente.');
  });

  it('rejects a code that is not 6 digits', async () => {
    await expect(
      useCase.resetPassword('usuaria@example.com', 'abc', 'newPassword123!')
    ).rejects.toMatchObject({ status: 400, code: 'CODE_INVALID' });
  });

  it('does not change the password when the code is wrong', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(user);
    jest
      .spyOn(EmailCodeService, 'validateCode')
      .mockRejectedValue(
        Object.assign(new Error('wrong'), { status: 400, code: 'CODE_INVALID' })
      );
    const updatePassword = jest.spyOn(UserModel, 'updatePassword');

    await expect(
      useCase.resetPassword('usuaria@example.com', '123456', 'newPassword123!')
    ).rejects.toMatchObject({ code: 'CODE_INVALID' });

    expect(updatePassword).not.toHaveBeenCalled();
  });
});
