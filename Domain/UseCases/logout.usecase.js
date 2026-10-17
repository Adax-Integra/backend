import AuthTokenModel from '../../Data/Models/authToken.model.js';

class LogoutUseCase {
  // Revokes only the token used for this logout request.
  async execute(userId, tokenHash) {
    await AuthTokenModel.deleteByHash(userId, tokenHash);
  }
}

export default LogoutUseCase;
