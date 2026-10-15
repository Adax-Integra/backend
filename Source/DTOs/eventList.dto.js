// Public URL of the "event-images" bucket in supabase

const EVENT_IMAGES_BUCKET = 'event-images';

const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/${imagePath}`;
};

// Only the fields the card need and the dates stay in  UTC so the frontend formats them
class EventListDTO {
  constructor(row) {
    this.id = row.event_id;
    this.title = row.title;
    this.description = row.description;
    this.startsAt = row.starts_at;
    this.endsAt = row.ends_at;
    this.modality = row.modality;
    this.location = row.location;
    this.imageUrl = buildImageUrl(row.image_path);
  }

  static fromRows(rows) {
    return rows.map((row) => new EventListDTO(row));
  }
}

export default EventListDTO;
