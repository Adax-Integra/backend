import bcrypt from 'bcryptjs';

import UserModel from '../../Data/Models/user.model.js';
import ChangePasswordValidator from '../../Data/Validators/changePassword.validator.js';

const BCRYPT_SALT_ROUNDS = 10;

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class ChangePasswordUseCase {
  async execute(userId, body) {
    const { currentPassword, newPassword } =
      ChangePasswordValidator.validateBody(body);

    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError('User not found.', 404);
    }

    const currentPasswordIsCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!currentPasswordIsCorrect) {
      throw createError('Current password is incorrect.', 401);
    }

    const newPasswordMatchesCurrent = await bcrypt.compare(
      newPassword,
      user.password
    );
    if (newPasswordMatchesCurrent) {
      throw createError(
        'new_password must be different from current_password.',
        400
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    const updatedUser = await UserModel.updatePassword(userId, passwordHash);
    if (!updatedUser) {
      throw createError('User not found.', 404);
    }
  }
}

export default ChangePasswordUseCase;
