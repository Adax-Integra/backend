import RequiredStringValidator from "./requiredString.validator";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validationError(message){
    return new Error(message);
}

//Shared by every table whose primary key is a UUID (users, help_types, cases, etc)
class ValidIdValidator {
    static validateId(value,fieldNad){
        const id= RequiredStringValidator.validateRequiredString(value, fieldName);
        if (!UUID_PATTERN.test(id)){
            throw validationError(`${fieldName} must be a valid UUID`);
        }
        return id;
    }
}

export default ValidIdValidator;