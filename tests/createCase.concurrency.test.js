import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';
import { supabase } from '../Data/Config/supabase.js';

/*
Exploratory R-02 test: the cap of 3 active cases is checked with a count
and then a separate insert (not atomic). Four simultaneous requests may
end up creating four cases. A failure here is a real defect, report it.
*/

const EXTERNAL_ROLE_ID = '8dfdf505-3d8d-423f-8c59-377c4f4c6477';
const MAX_ACTIVE_CASES = 3;

let userId;
let recordId;

const validBody = {
  writtenDescription: 'Concurrency test description',
  writtenHelpsWanted: 'Legal advice',
  hasExternalSupport: false,
};

beforeAll(async () => {
  const { data, error } = await supabase.rpc('register_external_user', {
    p_name: 'R02',
    p_last_name: 'Concurrency',
    p_email: `r02-concurrency-${Date.now()}@test.invalid`,
    p_password: 'not-a-real-hash',
    p_role_id: EXTERNAL_ROLE_ID,
    p_birth_date: null,
    p_phone: null,
    p_country: 'México',
    p_state: 'Jalisco',
    p_municipality: 'Guadalajara',
  });
  if (error) throw new Error(error.message);
  userId = data.user.user_id;

  const record = await supabase
    .from('record')
    .select('record_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();
  if (record.error) throw new Error(record.error.message);
  recordId = record.data.record_id;
});

afterAll(async () => {
  if (recordId) {
    const { data } = await supabase
      .from('case')
      .select('case_id')
      .eq('record_id', recordId);
    const caseIds = (data ?? []).map((c) => c.case_id);

    if (caseIds.length > 0) {
      await supabase.from('case_steps').delete().in('case_id', caseIds);
      await supabase.from('case_help').delete().in('case_id', caseIds);
      await supabase.from('case').delete().in('case_id', caseIds);
    }
  }

  if (userId) {
    await supabase.from('user_role').delete().eq('user_id', userId);
    await supabase.from('address').delete().eq('user_id', userId);
    await supabase.from('user').delete().eq('user_id', userId);
  }
});

describe('Exploratory concurrency test for R-02', () => {
  it('CON-01 never leaves more than 3 active cases', async () => {
    const token = jwt.sign(
      { user_id: userId, roles: ['external'] },
      process.env.JWT_SECRET
    );

    const responses = await Promise.all(
      Array.from({ length: MAX_ACTIVE_CASES + 1 }, () =>
        request(app)
          .post(`/api/external-users/${userId}/cases`)
          .set('Authorization', `Bearer ${token}`)
          .send(validBody)
      )
    );

    const created = responses.filter((r) => r.statusCode === 201).length;
    const { count } = await supabase
      .from('case')
      .select('case_id', { count: 'exact', head: true })
      .eq('record_id', recordId)
      .is('deleted_at', null)
      .neq('state', 'Closed');

    expect(created).toBeLessThanOrEqual(MAX_ACTIVE_CASES);
    expect(count).toBeLessThanOrEqual(MAX_ACTIVE_CASES);
  });
});
