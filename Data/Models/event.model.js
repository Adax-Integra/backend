import { supabase } from '../Config/supabase.js';

/**
 * Data model for the "event" table
 *
 * Returns the whole row; the DTO decides which fields reach the app.
 */
class EventModel {
  // event_id, created_at and updated_at are left to the database defaults.
  static async create({
    title,
    startsAt,
    endsAt,
    modality,
    location,
    link,
    phone,
    description,
    notes,
  }) {
    const { data, error } = await supabase
      .from('event')
      .insert({
        title,
        starts_at: startsAt,
        ends_at: endsAt,
        modality,
        location,
        link,
        phone,
        description,
        notes,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Only an active event is updated, so disabling it twice finds nothing
  static async disable(eventId) {
    const { data, error } = await supabase
      .from('event')
      .update({ deleted_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Active events are those that have not been deleted and have not ended yet startsBefore
  // keeps only events that start before it so it lets the use case ask for the events of the month for us E-01
  static async findActive({ startsBefore } = {}) {
    let query = supabase
      .from('event')
      .select('*')
      .is('deleted_at', null)
      .gte('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (startsBefore) {
      query = query.lt('starts_at', startsBefore);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default EventModel;
