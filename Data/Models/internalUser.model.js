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
    // hashedPassword, --- Laura deleted this
    phone,
    roleId,
    userId, // Laura added this
  }) {
    const { data: user, error: userError } = await supabase
      .from('user')
      .insert({
        name,
        last_name: lastName,
        email,
        // password: hashedPassword, --- Laura deleted this
        user_id: userId, // Laura added this
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
}

export default InternalUserModel;
