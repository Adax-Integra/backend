// G-04 - Is active validator
class AccountStatusValidator {
  static validateIsActive(isActive) {
    // If it is not boolean, it is a client error (400)
    if (typeof isActive !== 'boolean') {
      const error = new Error('is_active must be true or false');
      error.status = 400;
      throw error;
    }

    return isActive;
  }
}

export default AccountStatusValidator;
