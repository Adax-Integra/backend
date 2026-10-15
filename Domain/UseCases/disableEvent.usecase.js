import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import EventModel from '../../Data/Models/event.model.js';

/**
 * Disables an event so it stops showing up in the users' calendar.
 */
class DisableEventUseCase {
  async execute(eventId) {
    const validEventId = ValidIdValidator.validateId(eventId, 'eventId');
    const disabledEvent = await EventModel.disable(validEventId);

    if (!disabledEvent) {
      const error = new Error(
        'The event is already disabled or does not exist.'
      );
      error.status = 409;
      throw error;
    }

    return disabledEvent;
  }
}

export default DisableEventUseCase;
