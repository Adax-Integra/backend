import bcrypt from 'bcryptjs';
// bcrypt is used to compare the password entered by the user
import jwt from 'jsonwebtoken';
// Creates the JWT token after a successful login
import UserModel from '../../Data/Models/user.model.js';

// Creates an error with a message and an HTTP status code
function creaError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Login logic
class UserUseCase {
  async login(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw creaError('Email and password are required.', 400);
    } // Validates that the parameters are strings

    const cleanEmail = email.trim().toLowerCase();
    // trim() removes spaces at the beginning and end
    // Cleans the email before searching for it in the database

    if (cleanEmail === '' || password === '') {
      throw creaError('Email and password are required.', 400);
    }

    // Searches for the user in Supabase by email
    const user = await UserModel.findByEmail(cleanEmail);

    // If the user does not exist, a generic error message is sent to avoid giving clues to an attacker
    if (!user) {
      throw creaError('Invalid email or password.', 401);
    }

    // Compares the entered password with the stored hash
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    // const passwordIsCorrect = password === user.password;
    // bcrypt.compare() returns true if the password matches the hash, false otherwise

    if (!passwordIsCorrect) {
      throw creaError('Invalid email or password.', 401);
    }

    // Creates the token with the user's ID, valid for 120 hours.
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: '120h',
    });

    // Returns the token and the user ID (never the password)
    return { token, user_id: user.user_id };
  }
}

export default UserUseCase;
