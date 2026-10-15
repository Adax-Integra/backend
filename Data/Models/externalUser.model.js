import { supabase } from '../Config/supabase.js';

// G-16 shows 10 accounts per page, the same size as V-05 and V-06
const LIST_PAGE_SIZE = 10;

const EXTERNAL_USER_LIST_COLUMNS = `
  user_id,
  name,
  last_name,
  email,
  created_at,
  is_active
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
    phone,
    hashedPassword,
    roleId,
  }) {
    // sends the registration data to the supabase function
    const { data, error } = await supabase.rpc('create_external_account', {
      p_name: name,
      p_last_name: lastName,
      p_email: email,
      p_password: hashedPassword,
      p_phone: phone,
      p_role_id: roleId,
    });

    // pases the database error back to the use case if creation fails
    if (error) {
      // 23505 = unique violation: the email belongs to another account,
      // including deleted ones that findByEmail does not return
      if (error.code === '23505') {
        const conflict = new Error(
          'An account with this email already exists.'
        );
        conflict.status = 409;
        conflict.code = 'EMAIL_TAKEN';
        throw conflict;
      }

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
      p_country: address.country,
      p_state: address.state,
      p_municipality: address.municipality,
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
      console.error('Supabase findByEmail error:', error);
      throw new Error(error.message, { cause: error });
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

  /*
  R-04: the external user edits their own user row and address.
  Each table is only updated when it has changes. Returns false if a row
  to update does not exist.
  */
  static async updateProfile(userId, profile, address) {
    if (Object.keys(profile).length > 0) {
      const { data, error } = await supabase
        .from('user')
        .update(profile)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select('user_id')
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        return false;
      }
    }

    if (Object.keys(address).length > 0) {
      const { data, error } = await supabase
        .from('address')
        .update(address)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select('user_id')
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        return false;
      }
    }

    return true;
  }

  // G-07: profile columns the admin can see, without the password hash
  static async findEditableProfileById(userId) {
    const { data, error } = await supabase
      .from('user')
      .select('user_id, name, last_name, email, birth_date, phone')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? null;
  }

  /*
  G-07: updates the user and address rows and writes the activity log
  inside the same supabase rpc, so a change is never saved without its log.
  */
  static async updateProfileWithLog({
    userId,
    actorId,
    profile,
    address,
    changes,
    reason,
  }) {
    const { data, error } = await supabase.rpc(
      'update_external_profile_with_log',
      {
        p_user_id: userId,
        p_actor_id: actorId,
        p_profile: profile,
        p_address: address,
        p_changes: changes,
        p_reason: reason,
        p_consent_confirmed: true,
      }
    );

    if (error) {
      // 23505 is the unique violation code. The email can still belong to a
      // deleted account, which findByEmail does not return
      if (error.code === '23505') {
        const conflict = new Error('This email is already registered');
        conflict.status = 409;
        throw conflict;
      }

      throw new Error(error.message);
    }

    return data;
  }

  // G-16: Gets a page of external accounts from the external_user_list view
  static async findAll({
    page = 1,
    search = '',
    status = 'active',
    sort = 'recent',
  } = {}) {
    const from = (page - 1) * LIST_PAGE_SIZE;
    const to = from + LIST_PAGE_SIZE - 1;

    let query = supabase
      .from('external_user_list')
      .select(EXTERNAL_USER_LIST_COLUMNS, { count: 'exact' });

    // "all" means no status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (search) {
      // Treats SQL wildcard characters as literal search text
      const escapedSearch = search.replace(/[\\%_]/g, '\\$&');

      // search_text has the full name and the email together
      query = query.ilike('search_text', `%${escapedSearch}%`);
    }

    if (sort === 'alphabetical') {
      query = query.order('full_name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query
      // user_id keeps a stable order between pages
      .order('user_id', { ascending: true })
      .range(from, to);

    if (error) {
      // PGRST103: the page is after the last account, so it is an empty page
      if (error.code === 'PGRST103') {
        return { users: [], total: count ?? 0, page, limit: LIST_PAGE_SIZE };
      }
      throw new Error(error.message);
    }
    return {
      users: data ?? [],
      total: count ?? 0,
      page,
      limit: LIST_PAGE_SIZE,
    };
  }
}

export default ExternalUserModel;
