import { supabase } from '../Config/supabase.js';

const EXTERNAL_PROFILE_PRESUBMISSION_COLUMNS = `
  name,
  last_name,
  email,
  birth_date,
  phone
`;

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
    name,
    lastName,
    email,
    hashedPassword,
    roleId,
  }) {
    const { data, error } = await supabase.rpc('create_external_account', {
      p_name: name,
      p_last_name: lastName,
      p_email: email,
      p_password: hashedPassword,
      p_role_id: roleId,
    });

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
  static async create({ profile, address, roleId, hashedPassword }) {
    const { data, error } = await supabase.rpc('register_external_user', {
      p_name: profile.name,
      p_last_name: profile.last_name,
      p_email: profile.email,
      p_password: hashedPassword,
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

  /*
  Find external user by email
  */
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

  /*
  Find external user profile columns by id
  */
  static async findProfileById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select(EXTERNAL_PROFILE_PRESUBMISSION_COLUMNS)
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

  /*
  Update external user columns
  */
  static async updateProfile(userId, payload) {
    const { data, error } = await supabase
      .from('user')
      .update(payload)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select(EXTERNAL_PROFILE_PRESUBMISSION_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default ExternalUserModel;
