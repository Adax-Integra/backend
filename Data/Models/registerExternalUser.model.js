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

  static async create({ profile, address, roleId, hashedPassword }) {
    const { data, error } = await supabase.rpc('register_external_user', {
      p_name: profile.name,
      p_last_name: profile.last_name,
      p_email: profile.email,
      p_password: hashedPassword,
      p_birth_date: profile.birth_date ?? null,
      p_phone: profile.phone ?? null,
      p_role_id: roleId,
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
}

export default RegisterExternalUserModel;
