// Creates an error with a message and an HTTP status code
function creaError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class LoginCredentialsValidator {
  // Checks that the email and password were provided and are strings
  static validateCredentials(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw creaError('Email and password are required.', 400);
    }

    // Cleans the email by removing extra spaces and converting it to lowercase
    const cleanEmail = email.trim().toLowerCase();

    // Checks that the email and password are not empty
    if (cleanEmail === '' || password === '') {
      throw creaError('Email and password are required.', 400);
    }

    // Returns the cleaned email so it can be used later
    return cleanEmail;
  }

  // Throws a generic error if no user was found for the given email
  static assertUserExists(user) {
    if (!user) {
      // Uses a generic message to avoid revealing whether the email exists
      throw creaError('Invalid email or password.', 401);
    }
  }

  // Throws a generic error if the password does not match the stored hash
  static assertPasswordIsCorrect(passwordIsCorrect) {
    if (!passwordIsCorrect) {
      // Uses a generic message to avoid revealing whether the email exists
      throw creaError('Invalid email or password.', 401);
    }
  }
}

// Exports the validator so it can be used in other files
export default LoginCredentialsValidator;
