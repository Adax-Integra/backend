import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';
import { supabase } from '../Data/Config/supabase.js';

/*
R-02 integration tests that create real cases in the Supabase project from
.env. An external user (and its record) is created in beforeAll and its
cases, steps and account are deleted in afterAll. Each run uses up one
record number. 6 requests reach createCaseLimiter (limit 10).
*/

const EXTERNAL_ROLE_ID = '8dfdf505-3d8d-423f-8c59-377c4f4c6477';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Confirm both values against the create_case RPC before running
const EXPECTED_STEPS = 3;
const INITIAL_STEP_STATUS = 'PENDIENTE';

let userId;
let recordId;
const createdCaseIds = [];

const tokenFor = (id) =>
  jwt.sign({ user_id: id, roles: ['external'] }, process.env.JWT_SECRET);

const postCase = (body) =>
  request(app)
    .post(`/api/external-users/${userId}/cases`)
    .set('Authorization', `Bearer ${tokenFor(userId)}`)
    .send(body);

const validBody = {
  writtenDescription: 'Integration test description',
  writtenHelpsWanted: 'Legal advice',
  hasExternalSupport: false,
};

async function getCaseRow(caseId) {
  const { data, error } = await supabase
    .from('case')
    .select(
      `case_id, record_id, state, written_description,
       written_helps_wanted, has_lawyer, deleted_at,
       case_steps ( step_number, status )`
    )
    .eq('case_id', caseId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function countActiveCases() {
  const { count, error } = await supabase
    .from('case')
    .select('case_id', { count: 'exact', head: true })
    .eq('record_id', recordId)
    .is('deleted_at', null)
    .neq('state', 'Closed');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function updateCase(caseId, changes) {
  const { error } = await supabase
    .from('case')
    .update(changes)
    .eq('case_id', caseId);
  if (error) throw new Error(error.message);
}

// Keeps the id of every case created through the API for the cleanup
function trackCreated(response) {
  if (response.statusCode === 201)
    createdCaseIds.push(response.body.data.caseId);
}

beforeAll(async () => {
  const { data, error } = await supabase.rpc('register_external_user', {
    p_name: 'R02',
    p_last_name: 'Test',
    p_email: `r02-test-${Date.now()}@test.invalid`,
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
  // Also catches cases the API created but the test did not track
  if (recordId) {
    const { data } = await supabase
      .from('case')
      .select('case_id')
      .eq('record_id', recordId);
    const caseIds = [
      ...new Set([...createdCaseIds, ...(data ?? []).map((c) => c.case_id)]),
    ];

    // Adjust the order if case_steps / case_help cascade on delete
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

describe('Integration tests for R-02 with the database', () => {
  it('DB-01 creates the case, trims the text and creates its steps', async () => {
    const response = await postCase({
      writtenDescription: '  Me siento en riesgo  ',
      writtenHelpsWanted: '  Asesoría legal  ',
      hasExternalSupport: true,
    });
    trackCreated(response);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);

    const { data } = response.body;
    expect(data.caseId).toMatch(UUID_PATTERN);
    expect(data.state).toBe('Open');
    expect(data.writtenDescription).toBe('Me siento en riesgo');
    expect(data.writtenHelpsWanted).toBe('Asesoría legal');
    expect(data.hasLawyer).toBe(true);
    expect(data.helps).toEqual([]);
    expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);

    const row = await getCaseRow(data.caseId);
    expect(row.record_id).toBe(recordId);
    expect(row.state).toBe('Open');
    expect(row.written_description).toBe('Me siento en riesgo');
    expect(row.written_helps_wanted).toBe('Asesoría legal');
    expect(row.has_lawyer).toBe(true);
    expect(row.deleted_at).toBeNull();
    expect(row.case_steps).toHaveLength(EXPECTED_STEPS);
    row.case_steps.forEach((step) =>
      expect(step.status).toBe(INITIAL_STEP_STATUS)
    );
  });

  it('DB-02 accepts the maximum lengths and stores "No" as false', async () => {
    const response = await postCase({
      writtenDescription: 'a'.repeat(5000),
      writtenHelpsWanted: 'b'.repeat(400),
      hasExternalSupport: false,
    });
    trackCreated(response);

    expect(response.statusCode).toBe(201);

    const row = await getCaseRow(response.body.data.caseId);
    expect(row.written_description).toHaveLength(5000);
    expect(row.written_helps_wanted).toHaveLength(400);
    expect(row.has_lawyer).toBe(false);
  });

  it('DB-03 allows the third active case', async () => {
    const response = await postCase(validBody);
    trackCreated(response);

    expect(response.statusCode).toBe(201);
    expect(await countActiveCases()).toBe(3);
  });

  it('DB-04 responds 409 on the fourth active case and creates nothing', async () => {
    const response = await postCase(validBody);
    trackCreated(response);

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({
      success: false,
      error: 'This record already has 3 active cases.',
      errors: null,
    });
    expect(await countActiveCases()).toBe(3);
  });

  it('DB-05 a closed case frees a slot', async () => {
    await updateCase(createdCaseIds[0], { state: 'Closed' });

    const response = await postCase(validBody);
    trackCreated(response);

    expect(response.statusCode).toBe(201);
    expect(await countActiveCases()).toBe(3);
  });

  it('DB-06 a soft deleted case frees a slot', async () => {
    await updateCase(createdCaseIds[1], {
      deleted_at: new Date().toISOString(),
    });

    const response = await postCase(validBody);
    trackCreated(response);

    expect(response.statusCode).toBe(201);
    expect(await countActiveCases()).toBe(3);
  });
});
