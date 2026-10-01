/*G-03: The admin fills the "Agregar Colaboradora" form.
The app enables "Guardar" only when every field is filled, but the server
repeats the same rules because a request can reach this endpoint outside
the mobile app
*/
import EmailValidator from './email.validator.js';
import RequiredStringValidator from './requiredString.validator.js';

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 50;
const MAX_LAST_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 128;
const MAX_PASSWORD_LENGTH = 128;
//Same phone rule as the self-registration (G-01): exactly 10 digits
const PHONE_PATTERN = /^\d{10}$/;

//Builds an Error carrying the per-field reasons so the controller can answer
//with { errors: { field: reason } } and the app can highlight each input
function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

class CreateCollaboratorValidator {
  static validateBody(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError({ body: 'Request body must be an object.' });
    }

    const collaborator = {};
    const errors = {};

    try {
      const name = RequiredStringValidator.validateRequiredString(
        body.name,
        'name'
      );
      if (name.length > MAX_NAME_LENGTH) {
        errors.name = `name must be at most ${MAX_NAME_LENGTH} characters.`;
      } else {
        collaborator.name = name;
      }
    } catch (error) {
      errors.name = error.message;
    }

    try {
      const lastName = RequiredStringValidator.validateRequiredString(
        body.last_name,
        'last_name'
      );
      if (lastName.length > MAX_LAST_NAME_LENGTH) {
        errors.last_name = `last_name must be at most ${MAX_LAST_NAME_LENGTH} characters.`;
      } else {
        collaborator.lastName = lastName;
      }
    } catch (error) {
      errors.last_name = error.message;
    }

    try {
      const email = EmailValidator.validateEmail(body.email).toLowerCase();
      if (email.length > MAX_EMAIL_LENGTH) {
        errors.email = `email must be at most ${MAX_EMAIL_LENGTH} characters.`;
      } else {
        collaborator.email = email;
      }
    } catch (error) {
      errors.email = error.message;
    }

    if (
      typeof body.password !== 'string' ||
      body.password.length < MIN_PASSWORD_LENGTH
    ) {
      errors.password = `password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    } else if (body.password.length > MAX_PASSWORD_LENGTH) {
      errors.password = `password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
    } else {
      collaborator.password = body.password;
    }

    try {
      const phone = RequiredStringValidator.validateRequiredString(
        body.phone,
        'phone'
      );
      if (!PHONE_PATTERN.test(phone)) {
        errors.phone = 'phone must contain exactly 10 digits.';
      } else {
        collaborator.phone = phone;
      }
    } catch (error) {
      errors.phone = error.message;
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return collaborator;
  }
}

export default CreateCollaboratorValidator;
