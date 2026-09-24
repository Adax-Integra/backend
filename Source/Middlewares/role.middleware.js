// Allows staff or the owner of the data to continue
export function adminInternalOnly(req, res, next) {
  // Gets the roles saved by the authentication middleware
  const roles = req.user.roles || [];

  // Checks if the user has an allowed role
  if (roles.includes('admin') || roles.includes('internal')) {
    return next();
  }

  // The user is authenticated but does not have permission
  return res.status(403).json({
    success: false,
    error: 'You do not have permission',
  });
}

// Allows staff or the owner of the data to continue
export function ownDataOnly(req, res, next) {
  const roles = req.user.roles || [];
  const isStaff = roles.includes('admin') || roles.includes('internal');

  // Checks if the requested user is the same user from the token
  const isOwner = req.user.user_id === req.params.userId;

  // Staff or the owner of the data can continue
  if (isStaff || isOwner) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'You do not have permission',
  });
}
