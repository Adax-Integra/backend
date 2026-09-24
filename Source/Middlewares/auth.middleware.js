import jwt from 'jsonwebtoken';

// Checks that the request includes a valid token
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    // If it doesn't meet either condition, it means we didn't receive a token correctly
    return res.status(401).json({
      success: false,
      error: 'Token is required.',
    });
  }

  const token = header.split(' ')[1];
  // Checks that the token was sent using Bearer

  try {
    // Verifies the token using the secret key
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Saves the user ID and roles so they can be used in the next middleware
    req.user = { user_id: payload.user_id, roles: payload.roles };
    next();
  } catch {
    // Returns an error if the token is invalid or expired
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

export default authMiddleware;
