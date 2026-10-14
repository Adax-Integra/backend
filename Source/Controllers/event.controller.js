import CreateEventUseCase from '../../Domain/UseCases/createEvent.usecase.js';
import CreateEventDTO from '../DTOs/createEvent.dto.js';

const createEventUseCase = new CreateEventUseCase();

class EventController {
  async createEvent(req, res) {
    try {
      const event = await createEventUseCase.execute(req.body);
      const payload = new CreateEventDTO(event).toJSON();

      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        //Keep database details in server logs instead of exposing them.
        console.error('Failed to create the event:', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to create the event.',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
        errors: error.details ?? null,
      });
    }
  }
}

export default new EventController();
