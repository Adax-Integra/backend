import CreateEventValidator from '../../Data/Validators/createEvent.validator.js';
import EventModel from '../../Data/Models/event.model.js';

/**
 * Registers a new event so it shows up in the users' calendar.
 */
class CreateEventUseCase {
  async execute(body) {
    const event = CreateEventValidator.validateCreateBody(body);

    return EventModel.create(event);
  }
}

export default CreateEventUseCase;
