import ExternalUserQueryValidator from '../../Data/Validators/externalUserQuery.validator.js';
import ExternalUserModel from '../../Data/Models/externalUser.model.js';

// G-16: the admin consults the list of external accounts
class ListExternalUsersUseCase {
  async execute(query) {
    const filters = ExternalUserQueryValidator.validateQuery(query);
    return ExternalUserModel.findAll(filters);
  }
}

export default ListExternalUsersUseCase;
