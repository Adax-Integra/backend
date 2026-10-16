import jwt from 'jsonwebtoken';

import AuthTokenModel from '../../Data/Models/authToken.model.js';
import SessionService from '../../Domain/Services/session.service.js';

// Validates the token and checks that its session is still active.
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token is required.',
    });
  }

  const token = header.slice(7).trim();
  let payload;

  // Rejects tokens with an invalid signature or expiration.
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof payload !== 'object' ||
      typeof payload.user_id !== 'string' ||
      !Array.isArray(payload.roles)
    ) {
      throw new Error('Invalid token payload.');
    }
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
  }

  const tokenHash = SessionService.hashToken(token);

  try {
    const isActive = await AuthTokenModel.isActive(payload.user_id, tokenHash);

    if (!isActive) {
      return res.status(401).json({
        success: false,
        error: 'Session is no longer active.',
      });
    }
  } catch {
    // A database failure does not mean the user's token is invalid.
    return res.status(503).json({
      success: false,
      error: 'Unable to validate the session. Please try again.',
    });
  }

  req.user = {
    user_id: payload.user_id,
    roles: payload.roles,
  };

  // Used by logout to clear only the token making the request.
  req.tokenHash = tokenHash;

  return next();
}

export default authMiddleware;
