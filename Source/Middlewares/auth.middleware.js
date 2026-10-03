import { supabase } from '../../Data/Config/supabase.js';
// import jwt from 'jsonwebtoken'; --- Laura deleted this

// Checks that the request includes a valid Supabase Auth token
// async because it has to wait for Supabase to verify the token
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  // The header must look like: "Bearer <token>"
  if (!header || !header.startsWith('Bearer ')) {
    // If it doesn't meet either condition, it means we didn't receive a token correctly
    return res.status(401).json({
      success: false,
      error: 'Token is required.',
    });
  }
  // Takes only the token without the word "Bearer"
  const token = header.split(' ')[1];

  // Asks Supabase if the token was signed by Supabase Auth and has not expired
  // getClaims does not throw, it returns the error inside "error"
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data) {
    // Returns an error if the token is invalid or expired
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  // sub is the user id (the same id as user_id in the user table)
  // user_roles is added to the token by the custom_access_token_hook in Supabase
  // req.user keeps the same shape as before, so role.middleware.js still works
  req.user = { user_id: data.claims.sub, roles: data.claims.user_roles };
  next();
}

export default authMiddleware;

// Notes:
// claims and sub are standard JWT names
// claims are the data stored inside the token (who the user is, roles, expiration)
// sub means "subject": the id of the user the token belongs to
