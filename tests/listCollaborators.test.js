import app from '../Source/app.js';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { supabase } from '../Data/Config/supabase.js';

// Password shared by the accounts that make the requests
const password = 'Prueba123!';
const adminEmail = `g06-admin-${Date.now()}@test.invalid`;
const internalEmail = `g06-internal-${Date.now()}@test.invalid`;

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

// Creates the accounts used only by these tests
beforeAll(async () => {
  const hash = await bcrypt.hash(password, 10);

  const { data: users } = await supabase
    .from('user')
    .insert([
      {
        name: 'Prueba',
        last_name: 'G-06 admin',
        email: adminEmail,
        password: hash,
        email_verified_at: new Date().toISOString(),
      },
      {
        name: 'Prueba',
        last_name: 'G-06 internal',
        email: internalEmail,
        password: hash,
        email_verified_at: new Date().toISOString(),
      },
    ])
    .select('user_id, last_name');

  // Finds each account by its last name to save its id
  adminId = users.find((user) => user.last_name === 'G-06 admin').user_id;
  internalId = users.find((user) => user.last_name === 'G-06 internal').user_id;

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
    { user_id: adminId, role_id: adminRoleId },
    { user_id: internalId, role_id: internalRoleId },
  ]);

  // Logs in with each account to get its token
  adminToken = await loginToken(adminEmail);
  internalToken = await loginToken(internalEmail);
});

// The tests write to the shared tables, so every account is removed at the end
afterAll(async () => {
  const userIds = [adminId, internalId];

  // The tokens are removed first because they belong to the users
  await supabase.from('auth_tokens').delete().in('user_id', userIds);
  await supabase.from('user_role').delete().in('user_id', userIds);
  await supabase.from('user').delete().in('user_id', userIds);
});

// G-06: Tests access to the list of internal collaborators
describe('Unit tests for G-06', () => {
  describe('GET /api/internal-users - list internal accounts', () => {
    // Verify that an admin can access the list
    describe('The user is an admin', () => {
      it('Should respond with code 200 and a list', async () => {
        const response = await request(app)
          .get('/api/internal-users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    // Verify that an internal user cannot access the list
    describe('The user is not an admin', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get('/api/internal-users')
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(403);
      });
    });

    // Verify that requests without a token are rejected
    describe('There is no token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get('/api/internal-users');

        expect(response.statusCode).toBe(401);
      });
    });
  });
});
