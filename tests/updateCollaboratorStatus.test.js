import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { supabase } from '../Data/Config/supabase.js';

// The role middleware only reads the roles, so any user id works here
const adminId = 'f776c596-e385-4e11-8e1e-554fac5da3f0';

const userToken = (roles) =>
  jwt.sign({ user_id: adminId, roles }, process.env.JWT_SECRET);

const authHeader = (roles) => `Bearer ${userToken(roles)}`;

// No user uses this id, so the collaborator is not found
const missingUserId = '2b1f7c3e-8d4a-4f6b-9c2d-1e3f5a7b9c0d';

let collaboratorId;

// Creates an active collaborator only for these tests
beforeAll(async () => {
  const { data: user } = await supabase
    .from('user')
    .insert({
      name: 'Prueba',
      last_name: 'G-04',
      email: `g04-test-${Date.now()}@test.invalid`,
      password: 'not-a-real-hash',
    })
    .select('user_id')
    .single();

  collaboratorId = user.user_id;

  const { data: role } = await supabase
    .from('role')
    .select('role_id')
    .eq('description', 'internal')
    .single();

  await supabase
    .from('user_role')
    .insert({ user_id: collaboratorId, role_id: role.role_id });
});

// The tests write to the shared tables, so the collaborator is removed at the end
afterAll(async () => {
  await supabase.from('user_role').delete().eq('user_id', collaboratorId);
  await supabase.from('user').delete().eq('user_id', collaboratorId);
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
          .set('Authorization', authHeader(['internal']))
          .send({ is_active: false });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains an invalid user id', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .patch('/api/internal-users/abc/status')
          .set('Authorization', authHeader(['admin']))
          .send({ is_active: false });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('userId must be a valid UUID');
      });
    });

    describe('It contains an is_active that is not true or false', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', authHeader(['admin']))
          .send({ is_active: 'no' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('is_active must be true or false');
      });
    });

    describe('It contains a collaborator that does not exist', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${missingUserId}/status`)
          .set('Authorization', authHeader(['admin']))
          .send({ is_active: false });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Collaborator not found');
      });
    });

    describe('It deactivates an active collaborator', () => {
      it('Should respond with code 200 and is_active false', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', authHeader(['admin']))
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
          .set('Authorization', authHeader(['admin']))
          .send({ is_active: false });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe('The account already has that status');
      });
    });

    describe('It activates an inactive collaborator', () => {
      it('Should respond with code 200 and is_active true', async () => {
        const response = await request(app)
          .patch(`/api/internal-users/${collaboratorId}/status`)
          .set('Authorization', authHeader(['admin']))
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
