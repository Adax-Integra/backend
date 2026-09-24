import { supabase } from '../Config/supabase.js';

class RoleModel {
  static async findIdByDescription(description) {
    const { data, error } = await supabase
      .from('role')
      .select('role_id')
      .eq('description', description)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error(`Role "${description}" not found.`);
    }

    return data.role_id;
  }
}

export default RoleModel;
