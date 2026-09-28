import { supabase } from '../Config/supabase.js';

class RoleModel {
  static async findIdByDescription(description) {
    // Finds the id of a role by its name, for example 'external'
    const { data, error } = await supabase
      .from('role')
      .select('role_id')
      .eq('description', description)
      .is('deleted_at', null) // Ignores deleted roles
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    // If the role does not exist, throws an error
    if (!data) {
      throw new Error(`Role "${description}" not found.`);
    }

    return data.role_id;
  }

  // Gets all the roles assigned to  a user
  static async findRolesByUserId(userId) {
    const { data, error } = await supabase
      .from('user_role')
      .select('role(description)') // Also brings the role name from the role table
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      throw new Error(error.message);
    }

    // Keeps only the role names
    return data.map((row) => row.role.description);
  }
}

export default RoleModel;
