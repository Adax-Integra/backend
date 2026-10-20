import app from '../Source/app.js';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { supabase } from '../Data/Config/supabase.js';

// Password shared by the accounts that make the requests
const password = 'Prueba123!';
const adminEmail = `g04-admin-${Date.now()}@test.invalid`;
const internalEmail = `g04-internal-${Date.now()}@test.invalid`;

// No user uses this id, so the collaborator is not found
const missingUserId = '2b1f7c3e-8d4a-4f6b-9c2d-1e3f5a7b9c0d';

let collaboratorId;
let adminId;
let internalId;
let adminToken;
let internalToken;

// Logs in with the account, so the token is saved as an active session
async function loginToken(email) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.body.data.token;
}

// Creates the collaborator and the accounts used only by these tests
beforeAll(async () => {
  const hash = await bcrypt.hash(password, 10);

  // The collaborator never logs in, so it does not need a real password
  const { data: users } = await supabase
    .from('user')
    .insert([
      {
        name: 'Prueba',
        last_name: 'G-04',
        email: `g04-test-${Date.now()}@test.invalid`,
        password: 'not-a-real-hash',
      },
      {
        name: 'Prueba',
        last_name: 'G-04 admin',
        email: adminEmail,
        password: hash,
        email_verified_at: new Date().toISOString(),
      },
      {
        name: 'Prueba',
        last_name: 'G-04 internal',
        email: internalEmail,
        password: hash,
        email_verified_at: new Date().toISOString(),
      },
    ])
    .select('user_id, last_name');

  // Finds each account by its last name to save its id
  collaboratorId = users.find((user) => user.last_name === 'G-04').user_id;
  adminId = users.find((user) => user.last_name === 'G-04 admin').user_id;
  internalId = users.find((user) => user.last_name === 'G-04 internal').user_id;

  // Gets the ids of the admin and internal roles
  const { data: roles } = await supabase
    .from('role')
    .select('role_id, description')
    .in('description', ['admin', 'internal']);

  const adminRoleId = roles.find(
    (role) => role.description === 'admin'
  ).role_id;
  const internalRoleId = roles.find(
    (role) => role.description === 'internal'
  ).role_id;

  // Gives each account its role
  await supabase.from('user_role').insert([
    { user_id: collaboratorId, role_id: internalRoleId },
    { user_id: adminId, role_id: adminRoleId },
    { user_id: internalId, role_id: internalRoleId },
  ]);

  // Logs in with each account to get its token
  adminToken = await loginToken(adminEmail);
  internalToken = await loginToken(internalEmail);
});

// The tests write to the shared tables, so every account is removed at the end
afterAll(async () => {
  const userIds = [collaboratorId, adminId, internalId];

  // The tokens are removed first because they belong to the users
  await supabase.from('auth_tokens').delete().in('user_id', userIds);
  await supabase.from('user_role').delete().in('user_id', userIds);
  await supabase.from('user').delete().in('user_id', userIds);
});

describe('Unit tests for G-04', () => {
  describe('PATCH /api/internal-users/:userId/status - activate or deactivate a collaborator', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .send({ is_active: false });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to an internal user', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', `Bearer ${internalToken}`)
          .send({ is_active: false });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains an invalid user id', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .patch('/api/internal-users/abc/status')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ is_active: false });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('userId must be a valid UUID');
      });
    });

    describe('It contains an is_active that is not true or false', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ is_active: 'no' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('is_active must be true or false');
      });
    });

    describe('It contains a collaborator that does not exist', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${missingUserId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ is_active: false });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Collaborator not found');
      });
    });

    describe('It deactivates an active collaborator', () => {
      it('Should respond with code 200 and is_active false', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ is_active: false });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toEqual({
          user_id: collaboratorId,
          is_active: false,
        });
      });
    });

    describe('It deactivates a collaborator that is already inactive', () => {
      it('Should respond with code 409', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ is_active: false });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe('The account already has that status');
      });
    });

    describe('It activates an inactive collaborator', () => {
      it('Should respond with code 200 and is_active true', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ is_active: true });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toEqual({
          user_id: collaboratorId,
          is_active: true,
        });
      });
    });
  });
});
