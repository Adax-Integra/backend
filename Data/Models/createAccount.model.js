// Created by Lakshmi Jara on 23/09/26.
// G-01

import { supabase } from '../Config/supabase.js';

class CreateAccountModel {
  // check wether an active account already uses this email
  static async fingByEmail(email) {
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

  // create the account and assign its role
  static async create({
    name,
    lastName,
    email,
    phone,
    hashedPassword,
    roleId,
  }) {
    const { data, error } = await supabase.rpc('create_external_account', {
      p_name: name,
      p_last_name: lastName,
      p_email: email,
      p_password: hashedPassword,
      p_phone: phone,
      p_role_id: roleId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default CreateAccountModel;
