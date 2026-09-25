create or replace function public.register_external_user(
  p_name text,
  p_last_name text,
  p_email text,
  p_password text,
  p_birth_date date,
  p_phone text,
  p_role_id uuid,
  p_address_line_1 text,
  p_address_line_2 text,
  p_neighborhood text,
  p_zip_code text,
  p_country text,
  p_state text,
  p_city text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_record_id uuid;
  v_address_id uuid;
  v_birth_date text;
begin
  insert into "user" (name, last_name, email, password, birth_date, phone)
  values (p_name, p_last_name, p_email, p_password, p_birth_date, p_phone)
  returning user_id, birth_date::text into v_user_id, v_birth_date;

  insert into user_role (user_id, role_id)
  values (v_user_id, p_role_id);

  insert into record (user_id)
  values (v_user_id)
  returning record_id into v_record_id;

  insert into address (
    user_id, address_line_1, address_line_2, neighborhood,
    zip_code, country, state, city
  )
  values (
    v_user_id, p_address_line_1, p_address_line_2, p_neighborhood,
    p_zip_code, p_country, p_state, p_city
  )
  returning address_id into v_address_id;

  return jsonb_build_object(
    'user', jsonb_build_object(
      'user_id', v_user_id,
      'name', p_name,
      'last_name', p_last_name,
      'email', p_email,
      'birth_date', v_birth_date,
      'phone', p_phone
    ),
    'record_id', v_record_id,
    'address_id', v_address_id
  );
end;
$$;