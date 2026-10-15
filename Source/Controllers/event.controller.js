import CreateEventUseCase from '../../Domain/UseCases/createEvent.usecase.js';
import CreateEventDTO from '../DTOs/createEvent.dto.js';
import DisableEventUseCase from '../../Domain/UseCases/disableEvent.usecase.js';
import DisableEventDTO from '../DTOs/disableEvent.dto.js';
import GetActiveEventsUseCase from '../../Domain/UseCases/getActiveEvents.usecase.js';
import EventListDTO from '../DTOs/eventList.dto.js';

const getActiveEventsUseCase = new GetActiveEventsUseCase();
const createEventUseCase = new CreateEventUseCase();
const disableEventUseCase = new DisableEventUseCase();

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

  async getActiveEvents(req, res) {
    try {
      const events = await getActiveEventsUseCase.execute({
        scope: req.query.scope,
      });
      const payload = events.map((event) => new EventListDTO(event).toJSON());

      return res.status(200).json({
        success: true,
        data: payload,
      });
    } catch (error) {
      const status = error.status ?? 500;

      if (status >= 500) {
        console.error('Failed to get the active events:', error);

        return res.status(500).json({
          success: false,
          error: 'Unable to get the events.',
        });
      }

      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new EventController();
