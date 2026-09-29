import UserUseCase from '../../Domain/UseCases/user.usecase.js';

// Creates a UserUseCase instance so we can use the login() method in this controller
const userUseCase = new UserUseCase();

class AuthController {
  // POST /api/auth/login // Method to log in
  async login(req, res) {
    // req:contains the information sent by the client.
    // res: is used to send the response back to the client.
    try {
      const body = req.body || {};
      // Sends the email and password to the UserUseCase.
      const data = await userUseCase.login(body.email, body.password);

      return res.status(200).json({
        // If the login is successful, we respond with HTTP status 200.
        success: true,
        data: data,
      });
    } catch (error) {
      // Expected errors (400 or 401): we explain the problem to the user
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
        // If UserUseCase threw an error that contains an HTTP status code in "error.status", we use that same code to respond
      }

      //console.error('Login failed:', error); // Message shown in the server console

      return res.status(500).json({
        // Something went wrong on the server while trying to log in
        success: false,
        error: 'Unable to log in.',
      });
    }
  }
}

// Creates and exports an AuthController instance
export default new AuthController();
