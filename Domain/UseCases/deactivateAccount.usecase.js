import UserModel from '../../Data/Models/user.model.js';
import LogActivityUseCase from './logActivity.usecase.js';

const logActivityUseCase = new LogActivityUseCase();

function requestError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// G-08: an external or internal user deactivates her own account
class DeactivateAccountUseCase {
  async execute(userId, roles = []) {
    // The admin account manages the platform, so it cannot be deactivated from the app
    if (roles.includes('admin')) {
      throw requestError('An admin account cannot be deactivated', 403);
    }

    if (!roles.includes('external') && !roles.includes('internal')) {
      throw requestError('You do not have permission', 403);
    }

    const deactivated = await UserModel.deactivate(userId);

    if (!deactivated) {
      throw requestError(
        'The account is already deactivated or does not exist.',
        409
      );
    }

    // The column details does not accept null, so the roles are saved there
    await logActivityUseCase.execute({
      actorId: userId,
      action: 'deactivate_account',
      entity: 'user',
      entityId: userId,
      details: { roles },
    });

    return {
      userId: deactivated.user_id,
      deactivatedAt: deactivated.deleted_at,
    };
  }
}

export default DeactivateAccountUseCase;
