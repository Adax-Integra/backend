/**
 * Output shape for an event that was just created
 *
 * The control dates (created_at, updated_at, deleted_at) stay on the server:
 * no screen shows them.
 */
class CreateEventDTO {
  constructor({
    event_id,
    title,
    starts_at,
    ends_at,
    modality,
    location,
    link,
    phone,
    description,
    notes,
  } = {}) {
    this.eventId = event_id ?? null;
    this.title = title ?? null;
    this.startsAt = starts_at ?? null;
    this.endsAt = ends_at ?? null;
    this.modality = modality ?? null;
    this.location = location ?? null;
    this.link = link ?? null;
    this.phone = phone ?? null;
    this.description = description ?? null;
    this.notes = notes ?? null;
  }

  toJSON() {
    return {
      eventId: this.eventId,
      title: this.title,
      startsAt: this.startsAt,
      endsAt: this.endsAt,
      modality: this.modality,
      location: this.location,
      link: this.link,
      phone: this.phone,
      description: this.description,
      notes: this.notes,
    };
  }
}

export default CreateEventDTO;
