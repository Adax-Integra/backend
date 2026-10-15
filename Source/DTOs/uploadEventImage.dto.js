/**
 * Output shape for an event whose image was just uploaded (E-04)
 *
 * The app only needs the public link, so the storage path stays in the server.
 */
class UploadEventImageDTO {
  constructor({ event_id, image_url } = {}) {
    this.eventId = event_id ?? null;
    this.imageUrl = image_url ?? null;
  }

  toJSON() {
    return {
      eventId: this.eventId,
      imageUrl: this.imageUrl,
    };
  }
}

export default UploadEventImageDTO;
