import { supabase } from '../Config/supabase.js';

/*
Data Model for internal users (collaborators).
Domain use cases call this layer to talk to Supabase.
*/
class InternalUserModel {
  /*
  G-03: Creates a collaborator account: a row in user and its role in
  user_role. If the role cannot be assigned, the new user row is removed
  so no half-created account is left behind.
  */
  static async create({
    name,
    lastName,
    email,
    hashedPassword,
    phone,
    roleId,
  }) {
    const { data: user, error: userError } = await supabase
      .from('user')
      .insert({
        name,
        last_name: lastName,
        email,
        password: hashedPassword,
        phone,
      })
      .select('user_id, name, last_name, email, phone')
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    const { error: roleError } = await supabase
      .from('user_role')
      .insert({ user_id: user.user_id, role_id: roleId });

    if (roleError) {
      await supabase.from('user').delete().eq('user_id', user.user_id);
      throw new Error(roleError.message);
    }

    return user;
  }

  // G-06: Gets all internal accounts
  static async findAll() {
    const { data, error } = await supabase
      .from('user')
      // Joins tables to get user roles
      .select(
        `
        user_id,
        name,
        last_name,
        email,
        created_at,
        deleted_at,
        user_role!inner (
          role!inner (description)
        )
      `
      )

      // Only gets users with the internal role
      .in('user_role.role.description', ['internal'])
      // Ignores roles that were removed from the user
      .is('user_role.deleted_at', null)
      // Sorts by creation date (newest to oldest)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default InternalUserModel;
