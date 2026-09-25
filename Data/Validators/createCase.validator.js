/*R-02: The external user fills three fields before "Crear caso" is enabled
The client disables the button, but the server repeats the same rule because
nothing stops a request from reaching this endpoint outside the mobile app
*/
import ValidIdValidator from './validId.validator.js';

//"case".written_description has no length limit in Postgres
//Cap it here so a single request cannot push an unbouned payload through the t3.nano instance
const MAX_DESCRIPTION_LENGTH = 5000;

//Builds an Error carrying the per-field reasons so the controller can answer
//with { errors: { field:reason}} and the app can highlight each input
function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

class CreateCaseValidator {
  static validateCreateBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError({ body: 'Request body must be an object' });
    }

    const errors = {};
    const { writtenDescription, helpTypeId, hasExternalSupport } = body;

    //"Descripción del caso": a value made only of spaces counts as empty, matching
    //the trim the client applies before enabling the button
    if (typeof writtenDescription !== 'string') {
      errors.writtenDescription = 'writtenDescription must be a string';
    } else if (writtenDescription.trim() === '') {
      errors.writtenDescription = 'writtenDescription is required';
    } else if (writtenDescription.trim().length > MAX_DESCRIPTION_LENGTH) {
      errors.writtenDescription = `writtenDescription must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
    }

    /*¿Que ayuda esperas recibir?: the dropdown sends a help_types id
    Existence is confirmed later against the cataloge
    The shared validators throw on the first failure, so the message is
    caught here to keep collecting the rest of the per-field errors
    */
    let validHelpTypeId;
    try{
      validHelpTypeId = ValidIdValidator.validateId(helpTypeId,'helpTypeId');  
    }
    catch (error){
      errors.helpTypeId = error.message;
    }

    //¿Cuentas con apoyo externo?: the Sí/No dropdown maps to a boolean
    //Strings and numbers are rejected so "No" cannot arrive as a truthy value
    if (typeof hasExternalSupport !== 'boolean') {
      errors.hasExternalSupport = 'hasExternalSupport must be true or false';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return {
      writtenDescription: writtenDescription.trim(),
      helpTypeId: validHelpTypeId,
      hasExternalSupport,
    };
  }
}

export default CreateCaseValidator;
