const MIN_PASSWORD_LENGTH = 8;

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class ChangePasswordValidator {
  static validateBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw createError('Request body must be an object.', 400);
    }

    const { current_password, new_password, confirm_password } = body;

    if (
      typeof current_password !== 'string' ||
      current_password.length === 0 ||
      typeof new_password !== 'string' ||
      new_password.length === 0 ||
      typeof confirm_password !== 'string' ||
      confirm_password.length === 0
    ) {
      throw createError(
        'current_password, new_password, and confirm_password are required.',
        400
      );
    }

    if (new_password.length < MIN_PASSWORD_LENGTH) {
      throw createError(
        'new_password must contain at least 8 characters.',
        400
      );
    }

    if (new_password !== confirm_password) {
      throw createError('new_password and confirm_password must match.', 400);
    }

    if (new_password === current_password) {
      throw createError(
        'new_password must be different from current_password.',
        400
      );
    }

    return { currentPassword: current_password, newPassword: new_password };
  }
}

export default ChangePasswordValidator;
