// Public bucket
const EVENT_IMAGES_BUCKET = 'event-images';

const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/${imagePath}`;
};

// Only the fields the app cards need
class EventListDTO {
  constructor(event) {
    this.event = event;
  }

  toJSON() {
    return {
      id: this.event.event_id,
      title: this.event.title,
      description: this.event.description,
      notes: this.event.notes ?? null,
      startsAt: this.event.starts_at,
      endsAt: this.event.ends_at,
      modality: this.event.modality,
      location: this.event.location,
      imageUrl: buildImageUrl(this.event.image_path),
      link: this.event.link ?? null,
      phone: this.event.phone ?? null,
    };
  }
}

export default EventListDTO;
