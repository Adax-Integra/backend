import ValidIdValidator from "./validId.validator.js";

class UserIdValidator{
  static validateUserId(userId){
    return ValidIdValidator.validateId(userId, 'userId');
  }
}

export default UserIdValidator;