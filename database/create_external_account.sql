-- Created by Lakshmi Jara on 23/09/26.

create or replace function public,create_external_account(
    p_name text,
    p_last_name text,
    p_email text,
    p_password text,
    p_phone text,
    p_role_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$ 
declare
    v_user_id uuid;
begin
-- create the user with password already hashed by the backend
insert into "user" (
    name,
    last_name,
    email,
    password,
    phone
)
values (
    p_name,
    p_last_name,
    p_email,
    p_password,
    p_phone
)
returning user_id into v_user_id;

-- assign the external role to the new account
insert into user_role (user_id, role_id)
values (v_user_id, p_role_id);

return jsnob_build_object(
    'user_id', v_user_id,
    'name', p_name,
    'last_name', p_last_name,
    'email', p_email,
    'phone', p_phone
);

end;
$$;