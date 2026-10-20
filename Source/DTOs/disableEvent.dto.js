/**
 * Output shape for an event that was just disabled (E-03)
 *
 * The column is deleted_at, but the event is only hidden, so the app reads it as disabledAt.
 */
class DisableEventDTO {
  constructor({ event_id, deleted_at } = {}) {
    this.eventId = event_id ?? null;
    this.disabledAt = deleted_at ?? null;
  }

  toJSON() {
    return {
      eventId: this.eventId,
      disabledAt: this.disabledAt,
    };
  }
}

export default DisableEventDTO;
