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
        email_verified_at: null,
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
  // G-10: Gets the full detail info of an internal account by its user id
  static async findById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select(
        `
        user_id,
        name,
        last_name,
        email,
        phone,
        created_at,
        deleted_at,
        office:offices (location),
        user_role!inner (
          role!inner (description)
        )
      `
      )
      .eq('user_id', userId)
      // Only internal accounts can be consulted
      .in('user_role.role.description', ['internal'])
      // Ignores roles that were removed from the user
      .is('user_role.deleted_at', null)
      // We dont filter user.deleted_at, so inactive internal users must  be visible
      // and their status is updated  in the DTO
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // R-10: Gets the active internal and admin accounts that can take a case
  static async findAssignable() {
    const { data, error } = await supabase
      .from('user')
      // Only what the app needs to pick someone, G-06 keeps the full list
      .select(
        `
        user_id,
        name,
        last_name,
        user_role!inner (
          role!inner (description)
        )
      `
      )
      .in('user_role.role.description', ['internal', 'admin'])
      // Ignores roles that were removed from the user
      .is('user_role.deleted_at', null)
      // Deactivated accounts cannot take new cases
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /*
  R-10: Checks the userId sent to POST /cases/:caseId/assignments before it
  is saved in case_assignment. 
  It works like G-10's findById but also accepts admins.
  */
  static async findAssignableById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select(
        `
        user_id,
        deleted_at,
        user_role!inner (
          role!inner (description)
        )
      `
      )
      .eq('user_id', userId)
      .in('user_role.role.description', ['internal', 'admin'])
      .is('user_role.deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // G-04: Activates or deactivates an internal account
  static async updateStatus(userId, isActive) {
    // If the account is activated, the deleted date is null
    let deletedAt = null;

    // Save today's date if the account is deactivated.
    if (isActive === false) {
      deletedAt = new Date().toISOString();
      // toISOString() returns a string in the format YYYY-MM-DDTHH:mm:ss.sssZ, which is compatible with Supabase timestamp columns
    }

    // Save the change in the user table
    const { data, error } = await supabase
      .from('user')
      .update({ deleted_at: deletedAt })
      .eq('user_id', userId)
      .select('user_id, deleted_at')
      .single();

    // If Supabase fails, report the error
    if (error) {
      throw new Error(error.message);
    }

    // Returns the user with its new status
    return data;
  }

  static async findEditableProfileById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select('user_id, name, last_name, email')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? null;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('user')
      .select('user_id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? null;
  }

  static async updateProfileWithLog({ userId, actorId, profile, changes }) {
    const { data, error } = await supabase.rpc(
      'update_internal_profile_with_log',
      {
        p_user_id: userId,
        p_actor_id: actorId,
        p_profile: profile,
        p_changes: changes,
      }
    );

    if (error) {
      if (error.code === '23505') {
        const conflict = new Error('This email is already registered');
        conflict.status = 409;
        throw conflict;
      }

      throw new Error(error.message);
    }

    return Array.isArray(data) ? data[0] : data;
  }
}

export default InternalUserModel;
