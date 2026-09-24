import bcrypt from 'bcryptjs';
// bcrypt is used to compare the password entered by the user
import jwt from 'jsonwebtoken';
// Creates the JWT token after a successful login
import UserModel from '../../Data/Models/user.model.js';
// Imports the validator used to check the login credentials
import LoginCredentialsValidator from '../../Data/Validators/loginCredentials.validator.js';

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

    // If the user does not exist, a generic error message is sent to avoid giving clues to an attacker
    LoginCredentialsValidator.assertUserExists(user);

    // Compares the entered password with the stored hash
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    // bcrypt.compare() returns true if the password matches the hash, false otherwise

    LoginCredentialsValidator.assertPasswordIsCorrect(passwordIsCorrect);

    // Creates the token with the user's ID, valid for 120 hours.
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: '120h',
    });

    // Returns the token and the user ID (never the password)
    return { token, user_id: user.user_id };
  }
}

export default UserUseCase;
