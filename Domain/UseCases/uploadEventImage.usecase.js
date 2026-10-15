import ValidIdValidator from '../../Data/Validators/validId.validator.js';
import EventModel from '../../Data/Models/event.model.js';

// The client sets the mimetype, so the first bytes confirm the file is really a picture
const IMAGE_SIGNATURES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
};

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Saves the picture of an active event, replacing the previous one if it had it.
 */
class UploadEventImageUseCase {
  async execute(eventId, file) {
    const validEventId = ValidIdValidator.validateId(eventId, 'eventId');

    if (!file) {
      throw requestError(400, 'image is required');
    }

    const signature = IMAGE_SIGNATURES[file.mimetype];
    if (!signature.every((byte, index) => file.buffer[index] === byte)) {
      throw requestError(400, 'image: only JPEG or PNG allowed.');
    }

    const event = await EventModel.findActiveById(validEventId);
    if (!event) {
      throw requestError(404, 'Event not found.');
    }

    const imagePath = await EventModel.uploadImage(validEventId, file);

    // If the path cannot be saved, the uploaded file would be left orphaned
    let updatedEvent;
    try {
      updatedEvent = await EventModel.setImagePath(validEventId, imagePath);
    } catch (error) {
      await EventModel.removeImage(imagePath);
      throw error;
    }

    if (!updatedEvent) {
      await EventModel.removeImage(imagePath);
      throw requestError(404, 'Event not found.');
    }

    if (event.image_path) {
      // The new image is already saved, so the request does not fail for this
      await EventModel.removeImage(event.image_path).catch((error) =>
        console.error('Failed to remove the previous event image:', error)
      );
    }

    return {
      ...updatedEvent,
      image_url: EventModel.getImageUrl(imagePath),
    };
  }
}

export default UploadEventImageUseCase;
