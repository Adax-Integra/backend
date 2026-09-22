import jwt from 'jsonwebtoken';
// Imports jsonwebtoken so we can verify the JWT tokens sent by the app

// Checks that the request includes a valid token.
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  // "Bearer" means that an authentication token comes after it
  if (!header || !header.startsWith('Bearer ')) {
    // If it doesn't meet either condition, it means we didn't receive a token correctly
    return res.status(401).json({
      success: false,
      error: 'Token is required.',
    });
  }

  const token = header.split(' ')[1]; // [1] means that we take only the token

  try {
    // Verifies the token using the secret key, if it's valid, it returns the information it contains
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Saves the ID so the controller knows who the user is
    req.user = { user_id: payload.user_id };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
  }
}

export default authMiddleware;
