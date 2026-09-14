import { supabase } from '../Config/supabase.js';

/**
 * Data Model for the "address" table.
 * Domain use cases call this layer to talk to Supabase.
 */
class AddressModel {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('address')
      .select(
        `
          address_id,
          address_line_1,
          address_line_2,
          neighborhood,
          zip_code,
          country,
          state,
          city
        `
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }
}

export default AddressModel;
