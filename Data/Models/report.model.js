import { supabase } from '../Config/supabase.js';

class ReportsModel {
  static async getInformationForReport(startDate, endDate) {
    // Gets all of the information by using the stored procedure in supabase
    // This function was made with the help of AI
    // I designed the original query and the AI helped me to organize all
    // the searched data

    /**
     * Fetches the following information from the database
     * Expects a start_date and end_date in format YYYY-MM-DD
     * Returns a json in the following format:
     * {Promise<{
     *   cases: { total: number, new: number, follow_up: number },
     *   cases_by_age: Record<'0-11'|'12-17'|'18-29'|'30-59'|'60+'|'unknown', number>,
     *   cases_by_region: Record<string, number>,
     *   cases_by_violence: Record<string, number>,
     *   cases_by_help: Record<string, number>,
     *   cases_by_severity: { severity_7_or_above: number, severity_6_or_below: number, no_violence_type: number }
     * }>}
     */
    const { data, error } = await supabase.rpc('get_information_for_report', {
      start_date: `${startDate}T00:00:00.000Z`,
      end_date: `${endDate}T23:59:59.999Z`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

/*
STORED PROCEDURE 

  with
  
  params as (
    select (start_date at time zone 'UTC') as d_from,
           (end_date at time zone 'UTC') as d_to
  ),

  -- Gets every case that hasnt been deleted
  valid_cases as (
    select c.case_id, c.region_id, c.state, c.created_at, c.updated_at,
           c.is_risk_situation, r.user_id, u.birth_date
    from public."case" c
    join public.record r  on r.record_id = c.record_id and r.deleted_at is null
    join public."user" u  on u.user_id   = r.user_id   and u.deleted_at is null
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
    'cases_by_region', (
      select coalesce(jsonb_object_agg(x.region, x.cases), '{}'::jsonb)
      from (
        select rg.description::text as region, count(s.case_id) as cases
        from public.regions rg
        join scoped s on s.region_id = rg.region_id
        group by rg.region_id, rg.description
        union all
        select 'No region', count(*)
        from scoped s
        where s.region_id is null
        having count(*) > 0
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
  );

*/

export default ReportsModel;
