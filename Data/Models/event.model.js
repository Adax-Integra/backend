import crypto from 'node:crypto';
import { supabase } from '../Config/supabase.js';

const EVENT_IMAGES_BUCKET = 'event-images';
const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

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

  static async findActiveById(eventId) {
    const { data, error } = await supabase
      .from('event')
      .select('*')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // The file name is generated here, the user's file name is never used
  static async uploadImage(eventId, file) {
    const extension = IMAGE_EXTENSIONS[file.mimetype];
    const path = `${eventId}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) {
      throw new Error(error.message);
    }

    return path;
  }

  static async setImagePath(eventId, imagePath) {
    const { data, error } = await supabase
      .from('event')
      .update({ image_path: imagePath })
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async removeImage(path) {
    const { error } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .remove([path]);

    if (error) {
      throw new Error(error.message);
    }
  }

  static getImageUrl(path) {
    if (!path) {
      return null;
    }

    const { data } = supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .getPublicUrl(path);

    return data?.publicUrl ?? null;
  }
}

export default EventModel;
