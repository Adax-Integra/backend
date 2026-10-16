import { supabase } from '../Config/supabase.js';

class ViolenceTypeModel {
  // Gets all active violence types
  static async findAllActive() {
    const { data, error } = await supabase
      .from('violence_types')
      .select('violence_id, description, severity')
      .is('deleted_at', null)
      .order('description', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}

export default ViolenceTypeModel;
