import bcrypt from 'bcryptjs';
// bcrypt is used to compare the password entered by the user
import jwt from 'jsonwebtoken';
// Creates the JWT token after a successful login
import UserModel from '../../Data/Models/user.model.js';
// Imports the validator used to check the login credentials
import RoleModel from '../../Data/Models/role.model.js';
// Imports the model used to retrieve the user's roles from the database
import LoginCredentialsValidator from '../../Data/Validators/loginCredentials.validator.js';

//Precomputed hash compared against when the email is unknown, so the login
// takes the same time whether or not the account exists, no timing oracle
const DUMMY_HASH = bcrypt.hashSync('invalid-placeholder-password', 10);

// Login logic
class UserUseCase {
  async login(email, password) {
    // Validates the parameters and returns the cleaned email
    // (trim() removes spaces at the beginning and end)

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

    const roles = await RoleModel.findRolesByUserId(user.user_id);
    // Gets the roles already assigned to the user

    // Creates the token with the user's ID, valid for 120 hours.
    const token = jwt.sign(
      { user_id: user.user_id, roles },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h',
      }
    );

    // Returns the token and the user ID (never the password)
    return { token, user_id: user.user_id, roles };
  }
}

export default UserUseCase;
