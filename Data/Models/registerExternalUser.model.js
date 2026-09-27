import { supabase } from '../Config/supabase.js';

class RegisterExternalUserModel {
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
  Create method uses a supabase rpc.
  This function is a transaction that creates a user and creates a row
  inside the address table for the same user.
  */
  static async create({ profile, roleId, hashedPassword }) {
    const { data, error } = await supabase.rpc('register_external_user', {
      p_name: profile.name,
      p_last_name: profile.last_name,
      p_email: profile.email,
      p_password: hashedPassword,
      p_role_id: roleId,
      p_birth_date: profile.birth_date ?? null,
      p_phone: profile.phone ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default RegisterExternalUserModel;
