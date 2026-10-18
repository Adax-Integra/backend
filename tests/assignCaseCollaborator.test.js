import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';
import { supabase } from '../Data/Config/supabase.js';
import AuthTokenModel from '../Data/Models/authToken.model.js';
import SessionService from '../Domain/Services/session.service.js';

/*
R-10 integration tests that list and assign internal or admin users to cases.
*/

const EXTERNAL_ROLE_ID = '8dfdf505-3d8d-423f-8c59-377c4f4c6477';

// No case or user uses this id
const missingId = '2b1f7c3e-8d4a-4f6b-9c2d-1e3f5a7b9c0d';

let externalUserId;
let openCaseId;
let closedCaseId;
let collaboratorId;
let inactiveCollaboratorId;
let adminId;

// The active collaborator is also who assigns, so the activity log has a real actor.
// The auth middleware only accepts stored sessions, so each token is saved first
async function authHeader(roles) {
  const token = jwt.sign(
    { user_id: collaboratorId, roles },
    process.env.JWT_SECRET,
    { expiresIn: '1h', jwtid: randomUUID() }
  );
  await AuthTokenModel.create(
    collaboratorId,
    SessionService.hashToken(token),
    new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );
  return `Bearer ${token}`;
}

const postAssignment = async (caseId, body, roles = ['internal']) =>
  request(app)
    .post(`/api/cases/${caseId}/assignments`)
    .set('Authorization', await authHeader(roles))
    .send(body);

const getCollaborators = async (roles = ['internal']) =>
  request(app)
    .get('/api/cases/collaborators')
    .set('Authorization', await authHeader(roles));

async function createInternalUser(deletedAt = null, roleName = 'internal') {
  const { data: user, error } = await supabase
    .from('user')
    .insert({
      name: 'Prueba',
      last_name: 'R-10',
      email: `r10-test-${Date.now()}-${Math.random()}@test.invalid`,
      password: 'not-a-real-hash',
      deleted_at: deletedAt,
    })
    .select('user_id')
    .single();
  if (error) throw new Error(error.message);

  const { data: role, error: roleError } = await supabase
    .from('role')
    .select('role_id')
    .eq('description', roleName)
    .single();
  if (roleError) throw new Error(roleError.message);

  await supabase
    .from('user_role')
    .insert({ user_id: user.user_id, role_id: role.role_id });

  return user.user_id;
}

async function createCase(recordId, state) {
  const { data, error } = await supabase
    .from('case')
    .insert({
      record_id: recordId,
      written_description: 'R-10 test description',
      written_helps_wanted: 'R-10 test helps',
      has_lawyer: false,
      state,
    })
    .select('case_id')
    .single();
  if (error) throw new Error(error.message);
  return data.case_id;
}

async function getAssignments(caseId) {
  const { data, error } = await supabase
    .from('case_assignment')
    .select('user_id, created_at, deleted_at')
    .eq('case_id', caseId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

beforeAll(async () => {
  const { data, error } = await supabase.rpc('register_external_user', {
    p_name: 'R10',
    p_last_name: 'Test',
    p_email: `r10-external-${Date.now()}@test.invalid`,
    p_password: 'not-a-real-hash',
    p_role_id: EXTERNAL_ROLE_ID,
    p_birth_date: null,
    p_phone: null,
    p_country: 'México',
    p_state: 'Jalisco',
    p_municipality: 'Guadalajara',
  });
  if (error) throw new Error(error.message);
  externalUserId = data.user.user_id;

  const record = await supabase
    .from('record')
    .select('record_id')
    .eq('user_id', externalUserId)
    .is('deleted_at', null)
    .single();
  if (record.error) throw new Error(record.error.message);

  openCaseId = await createCase(record.data.record_id, 'Open');
  closedCaseId = await createCase(record.data.record_id, 'Closed');
  collaboratorId = await createInternalUser();
  inactiveCollaboratorId = await createInternalUser(new Date().toISOString());
  adminId = await createInternalUser(null, 'admin');
});

// The tests write to the shared tables, so everything created is removed at the end
afterAll(async () => {
  const caseIds = [openCaseId, closedCaseId].filter(Boolean);
  const userIds = [
    externalUserId,
    collaboratorId,
    inactiveCollaboratorId,
    adminId,
  ].filter(Boolean);

  // activity_log does not cascade, its entries go before the actor
  if (collaboratorId) {
    await supabase
      .from('activity_log')
      .delete()
      .eq('actor_user_id', collaboratorId);
  }

  if (caseIds.length > 0) {
    await supabase.from('case_assignment').delete().in('case_id', caseIds);
    await supabase.from('case').delete().in('case_id', caseIds);
  }

  if (externalUserId) {
    await supabase.from('record').delete().eq('user_id', externalUserId);
    await supabase.from('address').delete().eq('user_id', externalUserId);
  }

  if (userIds.length > 0) {
    await supabase.from('auth_tokens').delete().in('user_id', userIds);
    await supabase.from('user_role').delete().in('user_id', userIds);
    await supabase.from('user').delete().in('user_id', userIds);
  }
});

describe('Integration tests for R-10', () => {
  describe('GET /api/cases/collaborators - list the accounts that can take a case', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get('/api/cases/collaborators');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to an external user', () => {
      it('Should respond with code 403', async () => {
        const response = await getCollaborators(['external']);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('The token belongs to an internal user', () => {
      it('Should respond with code 200 and only the basic data', async () => {
        const response = await getCollaborators(['internal']);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const collaborator = response.body.data.find(
          (user) => user.userId === collaboratorId
        );
        expect(collaborator).toEqual({
          userId: collaboratorId,
          name: 'Prueba',
          lastName: 'R-10',
        });
      });
    });

    describe('The token belongs to an admin', () => {
      it('Should respond with code 200 and include admins but not inactive or external accounts', async () => {
        const response = await getCollaborators(['admin']);

        expect(response.statusCode).toBe(200);

        const ids = response.body.data.map((user) => user.userId);
        expect(ids).toContain(collaboratorId);
        expect(ids).toContain(adminId);
        expect(ids).not.toContain(inactiveCollaboratorId);
        expect(ids).not.toContain(externalUserId);
      });
    });
  });

  describe('POST /api/cases/:caseId/assignments - assign a collaborator to a case', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .post(`/api/cases/${openCaseId}/assignments`)
          .send({ userId: collaboratorId });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to an external user', () => {
      it('Should respond with code 403', async () => {
        const response = await postAssignment(
          openCaseId,
          { userId: collaboratorId },
          ['external']
        );

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains an invalid case id', () => {
      it('Should respond with code 400', async () => {
        const response = await postAssignment('abc', {
          userId: collaboratorId,
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
        expect(response.body.error).toBe('caseId must be a valid UUID');
      });
    });

    describe('It contains no userId', () => {
      it('Should respond with code 400', async () => {
        const response = await postAssignment(openCaseId, {});

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
        expect(response.body.error).toBe('userId must be a non-empty string.');
      });
    });

    describe('It contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await postAssignment(openCaseId, { userId: 'abc' });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
        expect(response.body.error).toBe('userId must be a valid UUID');
      });
    });

    describe('It contains a case that does not exist', () => {
      it('Should respond with code 404', async () => {
        const response = await postAssignment(missingId, {
          userId: collaboratorId,
        });

        expect(response.statusCode).toBe(404);
        expect(response.body.code).toBe('CASE_NOT_FOUND');
      });
    });

    describe('It contains a closed case', () => {
      it('Should respond with code 409', async () => {
        const response = await postAssignment(closedCaseId, {
          userId: collaboratorId,
        });

        expect(response.statusCode).toBe(409);
        expect(response.body.code).toBe('CASE_CLOSED');
        expect(await getAssignments(closedCaseId)).toHaveLength(0);
      });
    });

    describe('It contains a user that does not exist', () => {
      it('Should respond with code 404', async () => {
        const response = await postAssignment(openCaseId, {
          userId: missingId,
        });

        expect(response.statusCode).toBe(404);
        expect(response.body.code).toBe('COLLABORATOR_NOT_FOUND');
      });
    });

    describe('It contains an external user', () => {
      it('Should respond with code 404', async () => {
        const response = await postAssignment(openCaseId, {
          userId: externalUserId,
        });

        expect(response.statusCode).toBe(404);
        expect(response.body.code).toBe('COLLABORATOR_NOT_FOUND');
      });
    });

    describe('It contains an inactive collaborator', () => {
      it('Should respond with code 409', async () => {
        const response = await postAssignment(openCaseId, {
          userId: inactiveCollaboratorId,
        });

        expect(response.statusCode).toBe(409);
        expect(response.body.code).toBe('COLLABORATOR_INACTIVE');
      });
    });

    describe('It assigns an active collaborator to an open case', () => {
      it('Should respond with code 200 and save the assignment and the log', async () => {
        const response = await postAssignment(openCaseId, {
          userId: collaboratorId,
        });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ success: true });

        const assignments = await getAssignments(openCaseId);
        expect(assignments).toHaveLength(1);
        expect(assignments[0].user_id).toBe(collaboratorId);
        expect(assignments[0].deleted_at).toBeNull();

        const { data: logs } = await supabase
          .from('activity_log')
          .select('action, entity, entity_id, details')
          .eq('actor_user_id', collaboratorId)
          .eq('action', 'assign_case_collaborator');
        expect(logs).toEqual([
          {
            action: 'assign_case_collaborator',
            entity: 'case',
            entity_id: openCaseId,
            details: { userId: collaboratorId },
          },
        ]);
      });
    });

    describe('It assigns the same collaborator again', () => {
      it('Should respond with code 200 and keep a single assignment', async () => {
        const response = await postAssignment(openCaseId, {
          userId: collaboratorId,
        });

        expect(response.statusCode).toBe(200);
        expect(await getAssignments(openCaseId)).toHaveLength(1);
      });
    });

    describe('It assigns a collaborator whose assignment was removed', () => {
      it('Should respond with code 200 and restore the same assignment', async () => {
        const [before] = await getAssignments(openCaseId);

        await supabase
          .from('case_assignment')
          .update({ deleted_at: new Date().toISOString() })
          .eq('case_id', openCaseId)
          .eq('user_id', collaboratorId);

        const response = await postAssignment(openCaseId, {
          userId: collaboratorId,
        });

        expect(response.statusCode).toBe(200);

        const assignments = await getAssignments(openCaseId);
        expect(assignments).toHaveLength(1);
        expect(assignments[0].deleted_at).toBeNull();
        expect(assignments[0].created_at).toBe(before.created_at);
      });
    });

    describe('It assigns an active admin to an open case', () => {
      it('Should respond with code 200 and save the assignment', async () => {
        const response = await postAssignment(openCaseId, { userId: adminId });

        expect(response.statusCode).toBe(200);

        const assignments = await getAssignments(openCaseId);
        expect(assignments.map((row) => row.user_id)).toContain(adminId);
      });
    });
  });
});
