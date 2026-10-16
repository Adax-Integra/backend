import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import CreateEventValidator from '../../Data/Validators/createEvent.validator.js';
import EventModel from '../../Data/Models/event.model.js';

// Updates the details of an active event so the calendar stays current.

class UpdateEventUseCase {
  async execute(eventId, body) {
    const validEventId = ValidIdValidator.validateId(eventId, 'eventId');

    // Editing sends the whole event, so it follows the same rules as creating it
    const event = CreateEventValidator.validateCreateBody(body);
    const updateEvent = await EventModel.update(validEventId, event);

    if (!updateEvent) {
      const error = new Error('The event does not exist or is disabled.');
      error.status = 404;
      throw error;
    }

    return updateEvent;
  }
}

export default UpdateEventUseCase;
