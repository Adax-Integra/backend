import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

import RoleModel from '../../Data/Models/role.model.js';
import AuthTokenModel from '../../Data/Models/authToken.model.js';

const TOKEN_EXPIRATION = '167h';

class SessionService {
  // Creates the same hash for token storage and validation.
  static hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
  }

  // Creates a token and stores its hash before returning the session.
  static async createSession(userId) {
    const roles = await RoleModel.findRolesByUserId(userId);

    const token = jwt.sign({ user_id: userId, roles }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
      // Makes each login token unique, even within the same second.
      jwtid: randomUUID(),
    });

    const tokenHash = SessionService.hashToken(token);

    // Uses the expiration of the token we just generated.
    const payload = jwt.decode(token);
    const expiresAt = new Date(payload.exp * 1000).toISOString();

    // Each login creates a separate record for its device.
    await AuthTokenModel.create(userId, tokenHash, expiresAt);

    return { token, user_id: userId, roles };
  }
}

export default SessionService;
