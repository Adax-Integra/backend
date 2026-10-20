import RequiredStringValidator from './requiredString.validator.js';
import PhoneValidator from './phone.validator.js';

const TEXT_LIMITS = {
  title: 150,
  location: 200,
  link: 500,
  description: 2000,
  notes: 1000,
};
const REQUIRED_TEXTS = ['title', 'description'];
const MODALITIES = ['Presencial', 'Virtual', 'Mixto'];
// Without an offset the event would be stored at a different hour
const TIME_ZONE_PATTERN = /(Z|[+-]\d{2}:\d{2})$/;

function validationError(errors) {
  const error = new Error(Object.values(errors).join(' '));
  error.status = 400;
  error.details = errors;
  return error;
}

function validateDateTime(value, fieldName) {
  if (
    typeof value !== 'string' ||
    !TIME_ZONE_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${fieldName} must be a date and time with a time zone`);
  }
  return new Date(value);
}

class CreateEventValidator {
  static validateCreateBody(body = {}) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw validationError({ body: 'Request body must be an object' });
    }

    const errors = {};
    const event = {};

    for (const [field, maxLength] of Object.entries(TEXT_LIMITS)) {
      try {
        let value;
        if (REQUIRED_TEXTS.includes(field)) {
          value = RequiredStringValidator.validateRequiredString(
            body[field],
            field
          );
        } else if (body[field] === undefined || body[field] === null) {
          value = null;
        } else if (typeof body[field] !== 'string') {
          throw new Error(`${field} must be a string`);
        } else {
          value = body[field].trim() || null;
        }

        if (value && value.length > maxLength) {
          throw new Error(`${field} must be at most ${maxLength} characters`);
        }
        event[field] = value;
      } catch (error) {
        errors[field] = error.message;
      }
    }

    // Blocks javascript: and other schemes that could run code when tapped
    if (event.link && !/^https?:\/\//i.test(event.link)) {
      errors.link = 'link must start with http:// or https://';
    }

    try {
      event.phone = body.phone
        ? PhoneValidator.validatePhone(body.phone)
        : null;
    } catch (error) {
      errors.phone = error.message;
    }

    for (const field of ['startsAt', 'endsAt']) {
      try {
        event[field] = validateDateTime(body[field], field);
      } catch (error) {
        errors[field] = error.message;
      }
    }
    if (event.startsAt && event.endsAt && event.endsAt <= event.startsAt) {
      errors.endsAt = 'endsAt must be after startsAt';
    }

    if (!MODALITIES.includes(body.modality)) {
      errors.modality = `modality must be one of: ${MODALITIES.join(', ')}`;
    }
    event.modality = body.modality;

    if (body.modality === 'Presencial' && !event.location && !errors.location) {
      errors.location = 'location is required when modality is Presencial';
    }

    if (Object.keys(errors).length > 0) {
      throw validationError(errors);
    }

    return {
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
    };
  }
}

export default CreateEventValidator;
