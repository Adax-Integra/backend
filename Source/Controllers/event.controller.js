import CreateEventUseCase from '../../Domain/UseCases/createEvent.usecase.js';
import CreateEventDTO from '../DTOs/createEvent.dto.js';
import DisableEventUseCase from '../../Domain/UseCases/disableEvent.usecase.js';
import DisableEventDTO from '../DTOs/disableEvent.dto.js';
import UpdateEventUseCase from '../../Domain/UseCases/updateEvent.usecase.js';

const createEventUseCase = new CreateEventUseCase();
const disableEventUseCase = new DisableEventUseCase();
const updateEventUseCase = new UpdateEventUseCase();

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

  async disableEvent(req, res) {
    try {
      const event = await disableEventUseCase.execute(req.params.eventId);
      const payload = new DisableEventDTO(event).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        //Keep database details in server logs instead of exposing them.
        console.error('Failed to disable the event:', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to disable the event.',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateEvent(req, res) {
    try {
      const event = await updateEventUseCase.execute(
        req.params.eventId,
        req.body
      );
      // The edited event has the same shape as a newly created one

      const payload = new CreateEventDTO(event).toJSON();

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        // keep database details in server logs instead of exposing them
        console.error('Failed to update the event:', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to update the event.',
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
