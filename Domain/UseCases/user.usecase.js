import bcrypt from 'bcryptjs';
// bcrypt is used to compare the password entered by the user
import UserModel from '../../Data/Models/user.model.js';
// Imports the validator used to check the login credentials
import LoginCredentialsValidator from '../../Data/Validators/loginCredentials.validator.js';
// Creates the session (JWT + roles), shared with the email verification (G-09)
import SessionService from '../Services/session.service.js';

//Precomputed hash compared against when the email is unknown, so the login
// takes the same time whether or not the account exists, no timing oracle
const DUMMY_HASH = bcrypt.hashSync('invalid-placeholder-password', 10);

// Login logic
class UserUseCase {
  async login(email, password) {
    // Validates the email and password and returns the cleaned email
    const cleanEmail = LoginCredentialsValidator.validateCredentials(
      email,
      password
    );

    // Searches for the user in Supabase by email
    const user = await UserModel.findByEmail(cleanEmail);

    //Always run bcrypt.compare against the real hash when the user exists,
    // against DUMMY_HASH when it does not so the response time doesn't reveal
    // whether the email is registered (removes the timing-based enumeration oracle)
    const hashToCompare = user ? user.password : DUMMY_HASH;
    const passwordIsCorrect = await bcrypt.compare(password, hashToCompare);

    // If the user does not exist, a generic error message is sent to avoid giving clues to an attacker
    LoginCredentialsValidator.assertUserExists(user);

    LoginCredentialsValidator.assertPasswordIsCorrect(passwordIsCorrect);

    // G-09: checked only after the password is correct, so this answer
    // cannot be used to find out which emails are registered
    if (!user.email_verified_at) {
      const error = new Error('Email not verified.');
      error.status = 403;
      error.code = 'EMAIL_NOT_VERIFIED';
      throw error;
    }

    // Returns the token, the user ID and the roles (never the password)
    return SessionService.createSession(user.user_id);
  }
}

export default UserUseCase;
