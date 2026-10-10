import jwt from 'jsonwebtoken';

import RoleModel from '../../Data/Models/role.model.js';

const TOKEN_EXPIRATION = '8h';

// Builds the session the app recieves after login or email verification
class SessionService {
  static async createSession(userId) {
    const roles = await RoleModel.findRolesByUserId(userId);

    const token = jwt.sign({ user_id: userId, roles }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
    });

    // same shape as the login responsem, so we can reuse LoginDataDto
    return { token, user_id: userId, roles };
  }
}

export default SessionService;
