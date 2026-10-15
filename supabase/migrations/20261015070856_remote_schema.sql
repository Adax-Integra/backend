SET local check_function_bodies = off;

CREATE SCHEMA "public_2";

CREATE SCHEMA "test";

CREATE TABLE "public"."activity_log" (
  "log_id"        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "actor_user_id" uuid                     NOT NULL,
  "action"        text                     NOT NULL,
  "entity"        text                     NOT NULL,
  "entity_id"     uuid                     NOT NULL,
  "details"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "activity_log_pkey" PRIMARY KEY (log_id)
);

ALTER TABLE "public"."activity_log"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."address" (
  "address_id"   uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id"      uuid                        NOT NULL,
  "country"      text,
  "state"        text,
  "municipality" text,
  "created_at"   timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"   timestamp without time zone,
  CONSTRAINT "address_pkey" PRIMARY KEY (address_id)
);

ALTER TABLE "public"."address"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."auth_tokens" (
  "token_hash" text                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "auth_tokens_pkey" PRIMARY KEY (token_hash)
);

ALTER TABLE "public"."auth_tokens"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."case_assignment" (
  "case_id"    uuid                        NOT NULL,
  "user_id"    uuid                        NOT NULL,
  "created_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp without time zone,
  CONSTRAINT "case_assignment_pkey" PRIMARY KEY (case_id, user_id)
);

ALTER TABLE "public"."case_assignment"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."case_changes" (
  "change_id"      uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "case_id"        uuid                        NOT NULL,
  "user_id"        uuid                        NOT NULL,
  "field_changed"  character varying           NOT NULL,
  "previous_value" text,
  "new_value"      text,
  "created_at"     timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"     timestamp without time zone,
  CONSTRAINT "case_changes_pkey" PRIMARY KEY (change_id)
);

ALTER TABLE "public"."case_changes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."case_help" (
  "case_id"    uuid                        NOT NULL,
  "help_id"    uuid                        NOT NULL,
  "created_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp without time zone,
  CONSTRAINT "case_help_pkey" PRIMARY KEY (case_id, help_id)
);

ALTER TABLE "public"."case_help"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."case_number_counters" (
  "year"       integer NOT NULL,
  "last_value" integer NOT NULL DEFAULT 0,
  CONSTRAINT "case_number_counters_pkey" PRIMARY KEY (year)
);

ALTER TABLE "public"."case_number_counters"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."case_steps" (
  "case_step_id" uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "case_id"      uuid                        NOT NULL,
  "step_number"  integer                     NOT NULL,
  "status"       character varying           NOT NULL,
  "created_at"   timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"   timestamp without time zone,
  CONSTRAINT "case_steps_pkey" PRIMARY KEY (case_step_id),
  CONSTRAINT "case_steps_step_number_check" CHECK (((step_number >= 1) AND (step_number <= 3))),
  CONSTRAINT "case_steps_unique_step" UNIQUE (case_id, step_number)
);

ALTER TABLE "public"."case_steps"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."case_violence" (
  "case_id"     uuid                        NOT NULL,
  "violence_id" uuid                        NOT NULL,
  "created_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  timestamp without time zone,
  CONSTRAINT "case_violence_pkey" PRIMARY KEY (case_id, violence_id)
);

ALTER TABLE "public"."case_violence"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."case" (
  "case_id"              uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "record_id"            uuid                        NOT NULL,
  "written_description"  character varying           NOT NULL,
  "written_helps_wanted" character varying           NOT NULL,
  "has_lawyer"           boolean,
  "state"                character varying           NOT NULL,
  "created_at"           timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"           timestamp without time zone,
  "case_number"          text,
  "is_risk_situation"    boolean                     DEFAULT false,
  CONSTRAINT "case_case_number_key" UNIQUE (case_number),
  CONSTRAINT "case_pkey" PRIMARY KEY (case_id)
);

ALTER TABLE "public"."case"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."comment" (
  "comment_id" uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id"    uuid                        NOT NULL,
  "case_id"    uuid                        NOT NULL,
  "content"    text                        NOT NULL,
  "time_sent"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp without time zone,
  CONSTRAINT "comment_pkey" PRIMARY KEY (comment_id)
);

ALTER TABLE "public"."comment"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."countries" (
  "country_id" uuid    NOT NULL DEFAULT gen_random_uuid(),
  "iso2"       text    NOT NULL,
  "name_en"    text    NOT NULL,
  "name_es"    text    NOT NULL,
  "phone_code" text    NOT NULL,
  "is_active"  boolean NOT NULL DEFAULT true,
  CONSTRAINT "countries_iso2_key" UNIQUE (iso2),
  CONSTRAINT "countries_name_en_key" UNIQUE (name_en),
  CONSTRAINT "countries_name_es_key" UNIQUE (name_es),
  CONSTRAINT "countries_pkey" PRIMARY KEY (country_id)
);

ALTER TABLE "public"."countries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."email_code" (
  "user_id"      uuid                     NOT NULL,
  "purpose"      text                     NOT NULL,
  "code_hash"    text                     NOT NULL,
  "expires_at"   timestamp with time zone NOT NULL,
  "attempts"     integer                  NOT NULL DEFAULT 0,
  "last_sent_at" timestamp with time zone NOT NULL DEFAULT now(),
  "send_count"   integer                  NOT NULL DEFAULT 1,
  CONSTRAINT "email_code_attempts_check" CHECK ((attempts >= 0)),
  CONSTRAINT "email_code_pkey" PRIMARY KEY (user_id, purpose),
  CONSTRAINT "email_code_purpose_check" CHECK ((purpose = ANY (ARRAY['verify_email'::text, 'reset_password'::text]))),
  CONSTRAINT "email_code_send_count_check" CHECK ((send_count >= 1))
);

ALTER TABLE "public"."email_code"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event" (
  "event_id"    uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "title"       character varying           NOT NULL,
  "starts_at"   timestamp with time zone    NOT NULL,
  "ends_at"     timestamp with time zone    NOT NULL,
  "modality"    character varying           NOT NULL,
  "location"    character varying,
  "link"        character varying,
  "phone"       character varying,
  "description" character varying           NOT NULL,
  "notes"       character varying,
  "image_path"  character varying,
  "created_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  timestamp without time zone,
  CONSTRAINT "event_pkey" PRIMARY KEY (event_id)
);

ALTER TABLE "public"."event"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."folio_counter" (
  "year"        integer NOT NULL,
  "last_number" integer NOT NULL,
  CONSTRAINT "folio_counter_pkey" PRIMARY KEY (year)
);

ALTER TABLE "public"."folio_counter"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."help_types" (
  "help_id"     uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "description" character varying           NOT NULL,
  "created_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  timestamp without time zone,
  CONSTRAINT "help_types_pkey" PRIMARY KEY (help_id)
);

ALTER TABLE "public"."help_types"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."offices" (
  "office_id"  uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "location"   character varying           NOT NULL,
  "created_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp without time zone,
  CONSTRAINT "offices_pkey" PRIMARY KEY (office_id)
);

ALTER TABLE "public"."offices"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."privacy_policy_consent" (
  "consent_id"  uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id"     uuid                        NOT NULL,
  "policy_id"   uuid                        NOT NULL,
  "version"     character varying           NOT NULL,
  "is_accepted" boolean                     NOT NULL,
  "accepted_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address"  inet                        NOT NULL,
  "created_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  timestamp without time zone,
  CONSTRAINT "privacy_policy_consent_pkey" PRIMARY KEY (consent_id)
);

ALTER TABLE "public"."privacy_policy_consent"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."privacy_policy" (
  "policy_id"  uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "version"    character varying           NOT NULL,
  "content"    text                        NOT NULL,
  "created_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp without time zone,
  CONSTRAINT "privacy_policy_pkey" PRIMARY KEY (policy_id),
  CONSTRAINT "privacy_policy_version_key" UNIQUE (VERSION)
);

ALTER TABLE "public"."privacy_policy"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."record" (
  "record_id"     uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id"       uuid                        NOT NULL,
  "created_at"    timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"    timestamp without time zone,
  "record_number" text,
  "status"        text                        NOT NULL DEFAULT 'SIN_EMPEZAR'::text,
  CONSTRAINT "record_pkey" PRIMARY KEY (record_id),
  CONSTRAINT "record_record_number_key" UNIQUE (record_number),
  CONSTRAINT "record_status_check" CHECK ((status = ANY (ARRAY['SIN_EMPEZAR'::text, 'EN_REVISION'::text, 'EN_SEGUIMIENTO'::text, 'COMPLETADO'::text])))
);

ALTER TABLE "public"."record"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."role" (
  "role_id"     uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "description" character varying           NOT NULL,
  "created_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  timestamp without time zone,
  CONSTRAINT "role_pkey" PRIMARY KEY (role_id)
);

ALTER TABLE "public"."role"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."states" (
  "state_id"   uuid    NOT NULL DEFAULT gen_random_uuid(),
  "country_id" uuid,
  "name_en"    text    NOT NULL,
  "name_es"    text    NOT NULL,
  "code"       text    NOT NULL,
  "is_active"  boolean NOT NULL DEFAULT true,
  CONSTRAINT "states_pkey" PRIMARY KEY (state_id)
);

ALTER TABLE "public"."states"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_documents" (
  "document_id"       uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id"           uuid                        NOT NULL,
  "identity_document" character varying,
  "proof_of_address"  character varying,
  "created_at"        timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"        timestamp without time zone,
  CONSTRAINT "user_documents_pkey" PRIMARY KEY (document_id)
);

ALTER TABLE "public"."user_documents"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_role" (
  "user_id"    uuid                        NOT NULL,
  "role_id"    uuid                        NOT NULL,
  "created_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp without time zone,
  CONSTRAINT "user_role_pkey" PRIMARY KEY (user_id, role_id)
);

ALTER TABLE "public"."user_role"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user" (
  "user_id"           uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "name"              text                        NOT NULL,
  "last_name"         text                        NOT NULL,
  "email"             text                        NOT NULL,
  "password"          text,
  "office_id"         uuid,
  "birth_date"        date,
  "phone"             text,
  "created_at"        timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"        timestamp without time zone,
  "email_verified_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_email_key" UNIQUE (email),
  CONSTRAINT "user_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."user"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."violence_types" (
  "violence_id" uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "description" character varying           NOT NULL,
  "severity"    smallint                    NOT NULL,
  "created_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  timestamp without time zone,
  CONSTRAINT "violence_types_pkey" PRIMARY KEY (violence_id),
  CONSTRAINT "violence_types_severity_check" CHECK (((severity >= 1) AND (severity <= 10)))
);

ALTER TABLE "public"."violence_types"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_case (
  p_record_id            uuid,
  p_written_description  text,
  p_written_helps_wanted text,
  p_has_lawyer           boolean,
  p_state                text,
  p_step_status          text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
    v_case_id uuid;
    v_state varchar;
    v_created_at timestamp;
begin
-- "case" is quoted because case is a reserved word in SQL
insert into "case" (
    record_id,
    written_description,
    written_helps_wanted,
    has_lawyer,
    state
)
values (
    p_record_id,
    p_written_description,
    p_written_helps_wanted,
    p_has_lawyer,
    p_state
)
returning case_id, state, created_at into v_case_id, v_state, v_created_at;

-- case_steps has a CHECK of 1..3 and the progress screen (V-07) expects all three
insert into case_steps (case_id, step_number, status)
select v_case_id, step_number, p_step_status
from generate_series(1, 3) as step_number;

return jsonb_build_object(
    'case_id', v_case_id,
    'state', v_state,
    'created_at', v_created_at
);

end;
$function$;

CREATE OR REPLACE FUNCTION public.create_case_with_help (
  p_record_id            uuid,
  p_written_description  character varying,
  p_written_helps_wanted character varying,
  p_has_lawyer           boolean,
  p_help_id              uuid,
  p_state                character varying,
  p_step_status          character varying
)
  RETURNS jsonb
  LANGUAGE plpgsql
  AS $function$
declare
  v_case_id    uuid;
  v_state      character varying;
  v_created_at timestamp without time zone;
begin
  insert into public."case" (
    record_id,
    written_description,
    written_helps_wanted,
    has_lawyer,
    state
  )
  values (
    p_record_id,
    p_written_description,
    p_written_helps_wanted,
    p_has_lawyer,
    p_state
  )
  returning case_id, state, created_at
  into v_case_id, v_state, v_created_at;

  insert into public.case_help (case_id, help_id)
  values (v_case_id, p_help_id);

  -- case_steps.step_number is constrained to 1..3, so the progress screen
  -- (V-07) always finds the three rows it expects.
  insert into public.case_steps (case_id, step_number, status)
  select v_case_id, step, p_step_status
  from generate_series(1, 3) as step;

  return jsonb_build_object(
    'case_id',    v_case_id,
    'state',      v_state,
    'created_at', v_created_at
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_external_account (
  p_name      text,
  p_last_name text,
  p_email     text,
  p_password  text,
  p_phone     text,
  p_role_id   uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_user_id uuid;
  v_record_id uuid;
  v_address_id uuid;
  v_document_id uuid;
begin
  -- create the user with password already hashed by the backend.
  -- email_verified_at stays null until the user enters the emailed code (G-09)
  insert into "user" (name, last_name, email, password, phone, email_verified_at)
  values (p_name, p_last_name, p_email, p_password, p_phone, null)
  returning user_id into v_user_id;

  -- assign the external role to the new account
  insert into user_role (user_id, role_id)
  values (v_user_id, p_role_id);

  insert into record (user_id)
  values (v_user_id)
  returning record_id into v_record_id;

  -- empty row; address is collected later through the pre-submission PUT
  insert into address (user_id)
  values (v_user_id)
  returning address_id into v_address_id;

  -- empty row; documents are collected later through the pre-submission PUT
  insert into user_documents (user_id)
  values (v_user_id)
  returning document_id into v_document_id;

  return jsonb_build_object(
    'user', jsonb_build_object(
      'user_id', v_user_id,
      'name', p_name,
      'last_name', p_last_name,
      'email', p_email,
      'phone', p_phone
    ),
    'record_id', v_record_id,
    'address_id', v_address_id,
    'document_id', v_document_id
  );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."create_external_account"(text, text, text, text, text, uuid) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.create_external_account (
  p_name      text,
  p_last_name text,
  p_email     text,
  p_password  text,
  p_role_id   uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$declare
  v_user_id uuid;
  v_record_id uuid;
  v_address_id uuid;
  v_document_id uuid;
begin
  -- create the user with password already hashed by the backend
  insert into "user" (name, last_name, email, password, phone)
  values (p_name, p_last_name, p_email, p_password, p_phone)
  returning user_id into v_user_id;

  -- assign the external role to the new account
  insert into user_role (user_id, role_id)
  values (v_user_id, p_role_id);

  insert into record (user_id)
  values (v_user_id)
  returning record_id into v_record_id;

  -- empty row; address is collected later through the pre-submission PUT
  insert into address (user_id)
  values (v_user_id)
  returning address_id into v_address_id;

  -- empty row; documents are collected later through the pre-submission PUT
  insert into user_documents (user_id)
  values (v_user_id)
  returning document_id into v_document_id;

  return jsonb_build_object(
    'user', jsonb_build_object(
      'user_id', v_user_id,
      'name', p_name,
      'last_name', p_last_name,
      'email', p_email,
      'phone', p_phone
    ),
    'record_id', v_record_id,
    'address_id', v_address_id,
    'document_id', v_document_id
  );
end;$function$;

REVOKE ALL ON FUNCTION "public"."create_external_account"(text, text, text, text, uuid) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.create_self_registered_account (
  p_name      text,
  p_last_name text,
  p_email     text,
  p_password  text,
  p_phone     text,
  p_role_id   uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$ 
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

return jsonb_build_object(
    'user_id', v_user_id,
    'name', p_name,
    'last_name', p_last_name,
    'email', p_email,
    'phone', p_phone
);

end;
$function$;

CREATE OR REPLACE FUNCTION public.create_self_registered_account (
  p_user_id   uuid,
  p_name      text,
  p_last_name text,
  p_email     text,
  p_phone     text,
  p_role_id   uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  -- create the profile using the same id as auth.users
  insert into "user" (user_id, name, last_name, email, phone)
  values (p_user_id, p_name, p_last_name, p_email, p_phone);

  -- assign the external role to the new account
  insert into user_role (user_id, role_id)
  values (p_user_id, p_role_id);

  return jsonb_build_object(
    'user_id', p_user_id,
    'name', p_name,
    'last_name', p_last_name,
    'email', p_email,
    'phone', p_phone
  );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."create_self_registered_account"(uuid, text, text, text, text, uuid) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.custom_access_token_hook (
  event jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  AS $function$
declare
  roles jsonb;
begin
  select coalesce(jsonb_agg(r.description), '[]'::jsonb)
    into roles
  from public.user_role ur
  join public.role r on r.role_id = ur.role_id
  where ur.user_id = (event->>'user_id')::uuid
    and ur.deleted_at is null
    and r.deleted_at is null;

  return jsonb_set(event, '{claims,user_roles}', roles);
end;
$function$;

REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"(jsonb) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.get_information_for_report (
  start_date timestamp with time zone,
  end_date   timestamp with time zone
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO 'public', 'pg_temp'
  AS $function$with

  params as (
    select (start_date at time zone 'UTC') as d_from,
           (end_date at time zone 'UTC') as d_to
  ),

  -- Gets every case that hasnt been deleted
  -- CHANGED: region_id removed, the municipality now comes from the user's address
  valid_cases as (
    select c.case_id, c.state, c.created_at, c.updated_at,
           c.is_risk_situation, r.user_id, u.birth_date,
           a.municipality
    from public."case" c
    join public.record r  on r.record_id = c.record_id and r.deleted_at is null
    join public."user" u  on u.user_id   = r.user_id   and u.deleted_at is null
    -- A user can have several addresses, so we take only the most recent
    -- non-deleted one. This avoids duplicating cases and inflating the counts.
    left join lateral (
      select ad.municipality
      from public.address ad
      where ad.user_id = u.user_id
        and ad.deleted_at is null
      order by ad.created_at desc
      limit 1
    ) a on true
    where c.deleted_at is null
  ),

  -- Groups the cases based on when were they opened
  -- is_new are the cases that opened in the range 
  -- follow_up are the cases that were opened before and are still open or closed in the period
  scoped as (
    select vc.*,
           (vc.created_at between p.d_from and p.d_to) as is_new,
           case when vc.birth_date is null then null
                else extract(year from age(vc.created_at::date, vc.birth_date))::int
           end as age_years
    from valid_cases vc
    cross join params p
    where vc.created_at between p.d_from and p.d_to
       or (vc.created_at < p.d_from
           and (lower(btrim(vc.state)) <> 'closed' or vc.updated_at >= p.d_from))
  )


-- We build the JSON object
select jsonb_build_object(

    -- Groups the cases into new and follow_up. Total is the sum of the 2
    'cases', jsonb_build_object(
      'total',     (select count(*) from scoped),
      'new',       (select count(*) from scoped where is_new),
      'follow_up', (select count(*) from scoped where not is_new)
    ),
 
    -- We group them by the range of ages as stated in the Report document
    'cases_by_age', (
      select jsonb_build_object(
        '0-11',    count(*) filter (where age_years between 0 and 11),
        '12-17',   count(*) filter (where age_years between 12 and 17),
        '18-29',   count(*) filter (where age_years between 18 and 29),
        '30-59',   count(*) filter (where age_years between 30 and 59),
        '60+',     count(*) filter (where age_years >= 60),
        'unknown', count(*) filter (where age_years is null or age_years < 0)
      )
      from scoped
    ),
 
    -- Cases per region
    -- CHANGED: the "region" is now the municipality of the user's address.
    -- Cases with no address, or an empty municipality, go under 'No region'.
    'cases_by_region', (
      select coalesce(jsonb_object_agg(x.region, x.cases), '{}'::jsonb)
      from (
        select coalesce(nullif(btrim(s.municipality), ''), 'No region') as region,
               count(*) as cases
        from scoped s
        group by 1
      ) x
    ),
 
    -- Cases per violence type
    -- If a case has multiple violence types, then it will increase multiple rows
    'cases_by_violence', (
      select coalesce(jsonb_object_agg(x.name, x.cases), '{}'::jsonb)
      from (
        select btrim(vt.description, E' \t\r\n') as name,
               count(distinct s.case_id) as cases
        from public.violence_types vt
        left join public.case_violence cv on cv.violence_id = vt.violence_id and cv.deleted_at is null
        left join scoped s on s.case_id = cv.case_id
        where vt.deleted_at is null
        group by btrim(vt.description, E' \t\r\n')
      ) x
    ),

 
    -- Cases per help type
    -- If a case has multiple helps, then it will increase multiple rows
    'cases_by_help', (
      select coalesce(jsonb_object_agg(x.name, x.cases), '{}'::jsonb)
      from (
        select btrim(ht.description, E' \t\r\n') as name,
               count(distinct s.case_id) as cases
        from public.help_types ht
        left join public.case_help ch on ch.help_id = ht.help_id and ch.deleted_at is null
        left join scoped s on s.case_id = ch.case_id
        where ht.deleted_at is null
        group by btrim(ht.description, E' \t\r\n')
      ) x
    ),
 
    -- Cases flagged as a risk situation (null counts as not at risk)
    'cases_in_risk_situation', (
      select count(*) from scoped where is_risk_situation
    )
  );$function$;

REVOKE ALL ON FUNCTION "public"."get_information_for_report"(timestamp WITH time zone, timestamp WITH time zone) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_record_number()
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  y int := extract(year from now());
  n int;
begin
  insert into folio_counter (year, last_number)
  values (y, 1)
  on conflict (year)
  do update set last_number = folio_counter.last_number + 1
  returning last_number into n;

  return 'EXP-' || y || '-' || lpad(n::text, 4, '0');
end;
$function$;

CREATE OR REPLACE FUNCTION public.register_external_user (
  p_name         text,
  p_last_name    text,
  p_email        text,
  p_password     text,
  p_birth_date   date,
  p_phone        text,
  p_role_id      uuid,
  p_country      text,
  p_state        text,
  p_municipality text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_user_id uuid;
  v_record_id uuid;
  v_record_number text;
  v_address_id uuid;
  v_document_id uuid;
  v_birth_date date;
begin
  insert into "user" (name, last_name, email, password, birth_date, phone)
  values (p_name, p_last_name, p_email, p_password, p_birth_date, p_phone)
  returning user_id, birth_date into v_user_id, v_birth_date;

  insert into user_role (user_id, role_id)
  values (v_user_id, p_role_id);

  insert into record (user_id)
  values (v_user_id)
  returning record_id, record_number into v_record_id, v_record_number;

  insert into address (user_id, country, state, municipality)
  values (v_user_id, p_country, p_state, p_municipality)
  returning address_id into v_address_id;

  insert into user_documents (user_id)
  values (v_user_id)
  returning document_id into v_document_id;

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
    'record_number', v_record_number,
    'address_id', v_address_id,
    'document_id', v_document_id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.register_external_user (
  p_user_id        uuid,
  p_name           text,
  p_last_name      text,
  p_email          text,
  p_birth_date     date,
  p_phone          text,
  p_role_id        uuid,
  p_address_line_1 text,
  p_neighborhood   text,
  p_zip_code       text,
  p_country        text,
  p_state          text,
  p_city           text,
  p_address_line_2 text DEFAULT NULL::text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_record_id uuid;
  v_record_number text;
  v_address_id uuid;
  v_document_id uuid;
  v_birth_date date;
begin
  -- create the profile using the same id as auth.users
  insert into "user" (user_id, name, last_name, email, birth_date, phone)
  values (p_user_id, p_name, p_last_name, p_email, p_birth_date, p_phone)
  returning birth_date into v_birth_date;

  insert into user_role (user_id, role_id)
  values (p_user_id, p_role_id);

  insert into record (user_id)
  values (p_user_id)
  returning record_id, record_number into v_record_id, v_record_number;

  insert into address (
    user_id, address_line_1, address_line_2, neighborhood,
    zip_code, country, state, city
  )
  values (
    p_user_id, p_address_line_1, p_address_line_2, p_neighborhood,
    p_zip_code, p_country, p_state, p_city
  )
  returning address_id into v_address_id;

  -- empty row; documents are collected later through the pre-submission PUT
  insert into user_documents (user_id)
  values (p_user_id)
  returning document_id into v_document_id;

  return jsonb_build_object(
    'user', jsonb_build_object(
      'user_id', p_user_id,
      'name', p_name,
      'last_name', p_last_name,
      'email', p_email,
      'birth_date', v_birth_date,
      'phone', p_phone
    ),
    'record_id', v_record_id,
    'record_number', v_record_number,
    'address_id', v_address_id,
    'document_id', v_document_id
  );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."register_external_user"(uuid, text, text, text, date, text, uuid, text, text, text, text, text, text, text) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.set_case_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  yr  int;
  nxt int;
begin
  if new.case_number is not null then
    return new;
  end if;

  yr := extract(year from coalesce(new.created_at, now()) at time zone 'UTC')::int;

  insert into public.case_number_counters (year, last_value)
  values (yr, 1)
  on conflict (year)
  do update set last_value = public.case_number_counters.last_value + 1
  returning last_value into nxt;

  new.case_number := 'CAS-' || yr || '-' ||
                     case when nxt < 10000 then lpad(nxt::text, 4, '0') else nxt::text end;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_record_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if new.record_number is null then
    new.record_number := next_record_number();
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_external_profile_with_log (
  p_user_id           uuid,
  p_actor_id          uuid,
  p_profile           jsonb,
  p_address           jsonb,
  p_changes           jsonb,
  p_reason            text,
  p_consent_confirmed boolean
)
  RETURNS jsonb
  LANGUAGE plpgsql
  AS $function$
declare
  v_user public."user"%rowtype;
  v_address public.address%rowtype;
begin
  update public."user"
  set
    email = case when p_profile ? 'email' then p_profile->>'email' else email end,
    phone = case when p_profile ? 'phone' then p_profile->>'phone' else phone end
  where user_id = p_user_id
    and deleted_at is null
  returning * into v_user;

  if not found then
    raise exception 'User profile not found.';
  end if;

  if p_address <> '{}'::jsonb then
    update public.address
    set
      address_line_1 = case when p_address ? 'address_line_1' then p_address->>'address_line_1' else address_line_1 end,
      address_line_2 = case when p_address ? 'address_line_2' then p_address->>'address_line_2' else address_line_2 end,
      neighborhood   = case when p_address ? 'neighborhood'   then p_address->>'neighborhood'   else neighborhood end,
      zip_code       = case when p_address ? 'zip_code'       then p_address->>'zip_code'       else zip_code end,
      country        = case when p_address ? 'country'        then p_address->>'country'        else country end,
      state          = case when p_address ? 'state'          then p_address->>'state'          else state end,
      city           = case when p_address ? 'city'           then p_address->>'city'           else city end
    where user_id = p_user_id
      and deleted_at is null
    returning * into v_address;
  else
    select * into v_address
    from public.address
    where user_id = p_user_id
      and deleted_at is null
    limit 1;
  end if;

  insert into public.activity_log (actor_user_id, action, entity, entity_id, details)
  values (
    p_actor_id,
    'update_external_profile',
    'user',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'consent_confirmed', p_consent_confirmed,
      'changes', p_changes
    )
  );

  return jsonb_build_object(
    'profile', to_jsonb(v_user) - 'password',
    'address', to_jsonb(v_address)
  );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."update_external_profile_with_log"(uuid, uuid, jsonb, jsonb, jsonb, text, boolean) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.update_timestamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

ALTER TABLE "public"."case"
  ADD CONSTRAINT "cases_case_number_key" UNIQUE (case_number);

ALTER TABLE "public"."case_assignment"
  ADD CONSTRAINT "case_assignment_case_id_fkey" FOREIGN KEY (case_id) REFERENCES public."case"(case_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_changes"
  ADD CONSTRAINT "case_changes_case_id_fkey" FOREIGN KEY (case_id) REFERENCES public."case"(case_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_help"
  ADD CONSTRAINT "case_help_case_id_fkey" FOREIGN KEY (case_id) REFERENCES public."case"(case_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_steps"
  ADD CONSTRAINT "case_steps_case_id_fkey" FOREIGN KEY (case_id) REFERENCES public."case"(case_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_violence"
  ADD CONSTRAINT "case_violence_case_id_fkey" FOREIGN KEY (case_id) REFERENCES public."case"(case_id) ON DELETE CASCADE;

ALTER TABLE "public"."comment"
  ADD CONSTRAINT "comment_case_id_fkey" FOREIGN KEY (case_id) REFERENCES public."case"(case_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_help"
  ADD CONSTRAINT "case_help_help_id_fkey" FOREIGN KEY (help_id) REFERENCES public.help_types(help_id);

ALTER TABLE "public"."privacy_policy_consent"
  ADD CONSTRAINT "privacy_policy_consent_policy_id_fkey" FOREIGN KEY (policy_id) REFERENCES public.privacy_policy(policy_id);

ALTER TABLE "public"."case"
  ADD CONSTRAINT "case_record_id_fkey" FOREIGN KEY (record_id) REFERENCES public.record(record_id) ON DELETE CASCADE;

ALTER TABLE "public"."states"
  ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(country_id);

ALTER TABLE "public"."user"
  ADD CONSTRAINT "user_office_id_fkey" FOREIGN KEY (office_id) REFERENCES public.offices(office_id);

ALTER TABLE "public"."activity_log"
  ADD CONSTRAINT "activity_log_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES public."user"(user_id);

ALTER TABLE "public"."address"
  ADD CONSTRAINT "fk_address_user_id" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."auth_tokens"
  ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_assignment"
  ADD CONSTRAINT "case_assignment_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_changes"
  ADD CONSTRAINT "case_changes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."comment"
  ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."email_code"
  ADD CONSTRAINT "email_code_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."privacy_policy_consent"
  ADD CONSTRAINT "privacy_policy_consent_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."record"
  ADD CONSTRAINT "record_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."user_documents"
  ADD CONSTRAINT "user_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."user_role"
  ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.role(role_id);

ALTER TABLE "public"."user_role"
  ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."case_violence"
  ADD CONSTRAINT "case_violence_violence_id_fkey" FOREIGN KEY (violence_id) REFERENCES public.violence_types(violence_id);

CREATE VIEW "public"."external_user_list" WITH (security_invoker=true) AS  SELECT u.user_id,
    u.name,
    u.last_name,
    TRIM(BOTH FROM ((u.name || ' '::text) || COALESCE(u.last_name, ''::text))) AS full_name,
    ((TRIM(BOTH FROM ((u.name || ' '::text) || COALESCE(u.last_name, ''::text))) || ' '::text) || u.email) AS search_text,
    u.email,
    u.created_at,
    (u.deleted_at IS NULL) AS is_active
   FROM ((public."user" u
     JOIN public.user_role ur ON (((ur.user_id = u.user_id) AND (ur.deleted_at IS NULL))))
     JOIN public.role r ON (((r.role_id = ur.role_id) AND (r.deleted_at IS NULL) AND ((r.description)::text = 'external'::text))));

REVOKE ALL ON TABLE "public"."external_user_list" FROM "anon", "authenticated";

CREATE VIEW "public"."record_list" AS  SELECT r.record_id,
    r.user_id,
    TRIM(BOTH FROM concat_ws(' '::text, u.name, u.last_name)) AS name,
    r.updated_at,
    ( SELECT count(*) AS count
           FROM public."case" c
          WHERE ((c.record_id = r.record_id) AND (c.deleted_at IS NULL) AND ((c.state)::text = ANY (ARRAY[('Open'::character varying)::text, ('NUEVO'::character varying)::text])))) AS active_cases_count,
    r.record_number,
    r.status
   FROM (public.record r
     JOIN public."user" u ON ((u.user_id = r.user_id)))
  WHERE ((r.deleted_at IS NULL) AND (u.deleted_at IS NULL));

REVOKE ALL ON TABLE "public"."record_list" FROM "anon", "authenticated";

CREATE INDEX activity_log_created_at_idx ON public.activity_log USING btree (created_at DESC);

CREATE INDEX activity_log_entity_idx ON public.activity_log USING btree (entity, entity_id);

CREATE UNIQUE INDEX privacy_policy_consent_user_id_policy_id_key ON public.privacy_policy_consent USING btree (user_id, policy_id)
  WHERE (deleted_at IS NULL);

CREATE TRIGGER set_address_updated_at
  BEFORE UPDATE ON public.address
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_case_updated_at
  BEFORE UPDATE ON public."case"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_set_case_number
  BEFORE INSERT ON public."case"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_number();

CREATE TRIGGER set_case_changes_updated_at
  BEFORE UPDATE ON public.case_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_case_help_updated_at
  BEFORE UPDATE ON public.case_help
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_case_violence_updated_at
  BEFORE UPDATE ON public.case_violence
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_comment_updated_at
  BEFORE UPDATE ON public.comment
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_event_updated_at
  BEFORE UPDATE ON public.event
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_help_types_updated_at
  BEFORE UPDATE ON public.help_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_offices_updated_at
  BEFORE UPDATE ON public.offices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_record_updated_at
  BEFORE UPDATE ON public.record
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_set_record_number
  BEFORE INSERT ON public.record
  FOR EACH ROW
  EXECUTE FUNCTION public.set_record_number();

CREATE TRIGGER set_role_updated_at
  BEFORE UPDATE ON public.role
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_updated_at
  BEFORE UPDATE ON public."user"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_role_updated_at
  BEFORE UPDATE ON public.user_role
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_violence_types_updated_at
  BEFORE UPDATE ON public.violence_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Read access for countries" ON "public"."countries"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "auth admin reads role" ON "public"."role"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

CREATE POLICY "Read access for states" ON "public"."states"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "auth admin reads user_role" ON "public"."user_role"
  FOR SELECT
  TO "supabase_auth_admin"
  USING (true);

COMMENT ON COLUMN "public"."case"."case_number" IS 'ID to be displayed to user';

COMMENT ON COLUMN "public"."case"."is_risk_situation" IS 'When a case is considered as a risk situation, the internal will update this fiels';

COMMENT ON TABLE "public"."countries" IS 'Table for countries used in dropdown buttons';

GRANT EXECUTE ON FUNCTION "public"."create_case"(uuid, text, text, boolean, text, text) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."create_case"(uuid, text, text, boolean, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_case"(uuid, text, text, boolean, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_case"(uuid, text, text, boolean, text, text) TO "service_role";

GRANT EXECUTE
  ON FUNCTION "public"."create_case_with_help"(uuid, character varying, character varying, boolean, uuid, character varying, character varying)
  TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."create_case_with_help"(uuid, character varying, character varying, boolean, uuid, character varying, character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_case_with_help"(uuid, character varying, character varying, boolean, uuid, character varying, character varying) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_case_with_help"(uuid, character varying, character varying, boolean, uuid, character varying, character varying) TO "service_role";

REVOKE ALL ON FUNCTION "public"."create_external_account"(text, text, text, text, text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_external_account"(text, text, text, text, text, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_external_account"(text, text, text, text, text, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."create_external_account"(text, text, text, text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_external_account"(text, text, text, text, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_external_account"(text, text, text, text, uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."create_self_registered_account"(text, text, text, text, text, uuid) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."create_self_registered_account"(text, text, text, text, text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_self_registered_account"(text, text, text, text, text, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_self_registered_account"(text, text, text, text, text, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."create_self_registered_account"(uuid, text, text, text, text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_self_registered_account"(uuid, text, text, text, text, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_self_registered_account"(uuid, text, text, text, text, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"(jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."custom_access_token_hook"(jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."custom_access_token_hook"(jsonb) TO "service_role", "supabase_auth_admin";

REVOKE ALL ON FUNCTION "public"."get_information_for_report"(timestamp WITH time zone, timestamp WITH time zone) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_information_for_report"(timestamp WITH time zone, timestamp WITH time zone) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_information_for_report"(timestamp WITH time zone, timestamp WITH time zone) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."next_record_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."next_record_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."next_record_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."next_record_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."register_external_user"(text, text, text, text, date, text, uuid, text, text, text) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."register_external_user"(text, text, text, text, date, text, uuid, text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."register_external_user"(text, text, text, text, date, text, uuid, text, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."register_external_user"(text, text, text, text, date, text, uuid, text, text, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."register_external_user"(uuid, text, text, text, date, text, uuid, text, text, text, text, text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."register_external_user"(uuid, text, text, text, date, text, uuid, text, text, text, text, text, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."register_external_user"(uuid, text, text, text, date, text, uuid, text, text, text, text, text, text, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_case_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_case_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_case_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_case_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_record_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_record_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_record_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_record_number"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_external_profile_with_log"(uuid, uuid, jsonb, jsonb, jsonb, text, boolean) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_external_profile_with_log"(uuid, uuid, jsonb, jsonb, jsonb, text, boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_external_profile_with_log"(uuid, uuid, jsonb, jsonb, jsonb, text, boolean) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_timestamp"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."update_timestamp"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_timestamp"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_timestamp"() TO "service_role";

REVOKE ALL ON SCHEMA "public" FROM "supabase_auth_admin";

GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."activity_log" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."activity_log" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."activity_log" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."activity_log" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."address" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."address" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."address" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."address" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."auth_tokens" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."auth_tokens" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."auth_tokens" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."auth_tokens" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_assignment" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case_assignment" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_assignment" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_assignment" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_changes" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case_changes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_changes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_changes" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_help" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case_help" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_help" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_help" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_number_counters" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case_number_counters" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_number_counters" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_number_counters" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_steps" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case_steps" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_steps" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_steps" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_violence" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case_violence" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_violence" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_violence" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comment" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."comment" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comment" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comment" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."countries" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."countries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."countries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."countries" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."email_code" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."email_code" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."email_code" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."email_code" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."event" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."folio_counter" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."folio_counter" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."folio_counter" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."folio_counter" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."help_types" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."help_types" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."help_types" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."help_types" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."offices" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."offices" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."offices" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."offices" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."privacy_policy" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."privacy_policy" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."privacy_policy" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."privacy_policy" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."privacy_policy_consent" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."privacy_policy_consent" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."privacy_policy_consent" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."privacy_policy_consent" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."record" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."record" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."record" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."record" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."role" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role" TO "service_role";

GRANT SELECT ON TABLE "public"."role" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."states" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."states" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."states" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."states" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_documents" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_documents" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_documents" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_documents" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_role" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_role" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_role" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_role" TO "service_role";

GRANT SELECT ON TABLE "public"."user_role" TO "supabase_auth_admin";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."violence_types" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."violence_types" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."violence_types" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."violence_types" TO "service_role";

REVOKE ALL ON TABLE "public"."external_user_list" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."external_user_list" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."external_user_list" TO "service_role";

REVOKE ALL ON TABLE "public"."record_list" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."record_list" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."record_list" TO "service_role";

