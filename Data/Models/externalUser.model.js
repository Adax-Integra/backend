import { supabase } from '../Config/supabase.js';

/*
Data Model for the "external-user".
Domain use cases call this layer to talk to Supabase.
 */
class ExternalUserModel {
  /* 
  Create method for external user self-signup uses a supabase rpc.
  This function is a transaction that creates a user and creates a row
  inside the address table for the same user.
  */
  static async createAccount({
    userId, // Laura added this
    // hashedPassword ---  Laura deleted this
    name,
    lastName,
    email,
    phone,
    roleId,
  }) {
    // sends the registration data to the supabase function
    const { data, error } = await supabase.rpc(
      'create_self_registered_account',
      {
        p_user_id: userId, // Laura added this
        // p_password: hashedPassword, ---  Laura deleted this
        p_name: name,
        p_last_name: lastName,
        p_email: email,
        // p_password: hashedPassword, --- Laura deleted this
        p_phone: phone,
        p_role_id: roleId,
      }
    );

    // pases the database error back to the use case if creation fails
    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /*
  Create method for external user signup by internal user, also uses a supabase rpc.
  This function is a transaction that creates a user and creates a row
  inside the address table for the same user.
  */
  static async create({ userId, profile, address, roleId }) {
    // Laura added this
    // static async create({ profile, address, roleId, hashedPassword }) {  ---  Laura deleted this
    const { data, error } = await supabase.rpc('register_external_user', {
      p_user_id: userId, // Laura added this
      // p_password: hashedPassword, ---  Laura deleted this
      p_name: profile.name,
      p_last_name: profile.last_name,
      p_email: profile.email,
      p_role_id: roleId,
      p_birth_date: profile.birth_date ?? null,
      p_phone: profile.phone ?? null,
      p_address_line_1: address.address_line_1,
      p_address_line_2: address.address_line_2 ?? null,
      p_neighborhood: address.neighborhood,
      p_zip_code: address.zip_code,
      p_country: address.country,
      p_state: address.state,
      p_city: address.city,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // checks weather a usaer already has an account with this email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('user')
      .select('user_id') // only needs the user ID to know that an account exists
      .eq('email', email)
      .is('deleted_at', null) // ignores users marked as deleted
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? null;
  }

  // Find external user profile columns by id
  static async findProfileById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('User profile not found.');
    }

    return data;
  }

  // Update external user columns
  static async updateProfile(userId, payload) {
    const { data, error } = await supabase
      .from('user')
      .update(payload)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default ExternalUserModel;
