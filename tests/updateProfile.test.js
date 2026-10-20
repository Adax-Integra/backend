import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';
import { supabase } from '../Data/Config/supabase.js';
import ProfileModel from '../Data/Models/profile.model.js';
import ExternalUserModel from '../Data/Models/externalUser.model.js';

/*
The external user tests run against the real Supabase project from .env.
The external user is created in beforeAll and deleted in afterAll (the delete
cascades to its address, role, record and documents). Each run uses up one
record number. Staff updates use fakeQuery so no real staff account is changed.
*/

const EXTERNAL_ROLE_ID = '8dfdf505-3d8d-423f-8c59-377c4f4c6477';

// Not a real account, staff updates never reach the database
const STAFF_USER_ID = '0b7a1c1e-6f0a-4b55-9a4e-2f1d7f5c9a10';

const NONEXISTENT_USER_ID = '11111111-1111-4111-8111-111111111111';

let externalUserId;

const tokenFor = (roles, id) =>
  jwt.sign({ user_id: id, roles }, process.env.JWT_SECRET);

const patchProfile = (roles, body, id, tokenId = id) =>
  request(app)
    .patch(`/api/profile/${id}`)
    .set('Authorization', `Bearer ${tokenFor(roles, tokenId)}`)
    .send(body);

const getEditableProfile = (roles, id, tokenId = id) =>
  request(app)
    .get(`/api/profile/${id}/edit`)
    .set('Authorization', `Bearer ${tokenFor(roles, tokenId)}`);

async function getUser(id) {
  const { data, error } = await supabase
    .from('user')
    .select('name, last_name, phone, email, birth_date, deleted_at')
    .eq('user_id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function getAddress(id) {
  const { data, error } = await supabase
    .from('address')
    .select('country, state, municipality')
    .eq('user_id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Fake supabase query builder, records the calls and resolves with the given result
function fakeQuery(result) {
  const query = {
    update: jest.fn(() => query),
    eq: jest.fn(() => query),
    is: jest.fn(() => query),
    select: jest.fn(() => query),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
  };
  return query;
}

beforeAll(async () => {
  const { data, error } = await supabase.rpc('register_external_user', {
    p_name: 'R04',
    p_last_name: 'Test',
    p_email: `r04-test-${Date.now()}@test.invalid`,
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
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  if (externalUserId) {
    await supabase.from('user_role').delete().eq('user_id', externalUserId);
    await supabase.from('address').delete().eq('user_id', externalUserId);
    await supabase.from('user').delete().eq('user_id', externalUserId);
  }
});

describe('Unit tests for R-04', () => {
  describe('PATCH /api/profile/:userId - the user edits their own profile', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .patch(`/api/profile/${externalUserId}`)
          .send({ name: 'Ana' });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token is invalid', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .patch(`/api/profile/${externalUserId}`)
          .set('Authorization', 'Bearer not-a-real-token')
          .send({ name: 'Ana' });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('The user tries to edit another user profile', () => {
      it('Should respond with code 403 without updating', async () => {
        const before = await getUser(externalUserId);

        // Token belongs to another user, the URL points to the external one
        const response = await patchProfile(
          ['external'],
          { name: 'Intruder' },
          externalUserId,
          STAFF_USER_ID
        );

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
        expect(await getUser(externalUserId)).toEqual(before);
      });
    });

    describe('The token has no known role', () => {
      it('Should respond with code 403 without updating', async () => {
        const before = await getUser(externalUserId);

        const response = await patchProfile(
          ['guest'],
          { name: 'Guest' },
          externalUserId
        );

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
        expect(await getUser(externalUserId)).toEqual(before);
      });
    });

    describe('An external user edits personal data and address', () => {
      it('Should respond with code 200 and update both tables', async () => {
        const response = await patchProfile(
          ['external'],
          {
            name: 'Ana',
            last_name: 'López',
            phone: '+525512345678',
            state: ' Nuevo León ',
            municipality: 'Monterrey',
          },
          externalUserId
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: { message: 'Profile updated successfully.' },
        });
        expect(await getUser(externalUserId)).toMatchObject({
          name: 'Ana',
          last_name: 'López',
          phone: '+525512345678',
        });
        expect(await getAddress(externalUserId)).toEqual({
          country: 'México',
          state: 'Nuevo León',
          municipality: 'Monterrey',
        });
      });

      it('Should allow updating only the address', async () => {
        const before = await getUser(externalUserId);

        const response = await patchProfile(
          ['external'],
          { municipality: 'San Pedro Garza García' },
          externalUserId
        );

        expect(response.statusCode).toBe(200);
        expect(await getUser(externalUserId)).toEqual(before);
        expect((await getAddress(externalUserId)).municipality).toBe(
          'San Pedro Garza García'
        );
      });
    });

    describe.each([['admin'], ['internal']])(
      'An %s user edits personal data',
      (role) => {
        it('Should respond with code 200 and only update the user row', async () => {
          const userQuery = fakeQuery({
            data: { user_id: STAFF_USER_ID },
            error: null,
          });
          const from = jest.spyOn(supabase, 'from').mockReturnValue(userQuery);

          const response = await patchProfile(
            [role],
            { name: `R04 ${role}`, phone: '+525598765432' },
            STAFF_USER_ID
          );

          expect(response.statusCode).toBe(200);
          expect(response.body.success).toBe(true);
          expect(from).toHaveBeenCalledTimes(1);
          expect(from).toHaveBeenCalledWith('user');
          expect(userQuery.update).toHaveBeenCalledWith({
            name: `R04 ${role}`,
            phone: '+525598765432',
          });
          expect(userQuery.eq).toHaveBeenCalledWith('user_id', STAFF_USER_ID);
          expect(userQuery.is).toHaveBeenCalledWith('deleted_at', null);
        });

        it('Should respond with code 400 when sending address fields', async () => {
          const from = jest.spyOn(supabase, 'from');

          const response = await patchProfile(
            [role],
            { name: 'Changed', country: 'México' },
            STAFF_USER_ID
          );

          expect(response.statusCode).toBe(400);
          expect(response.body.errors).toEqual({
            country: 'country cannot be modified',
          });
          expect(from).not.toHaveBeenCalled();
        });
      }
    );

    describe('A user with both staff and external roles', () => {
      it('Should be treated as staff', async () => {
        const before = await getAddress(externalUserId);

        const response = await patchProfile(
          ['external', 'internal'],
          { country: 'Chile' },
          externalUserId
        );

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual({
          country: 'country cannot be modified',
        });
        expect(await getAddress(externalUserId)).toEqual(before);
      });
    });

    describe('The body contains fields that cannot be modified', () => {
      it.each([['email'], ['birth_date'], ['user_id'], ['password']])(
        'Should respond with code 400 when sending %s',
        async (field) => {
          const before = await getUser(externalUserId);

          const response = await patchProfile(
            ['external'],
            { name: 'Changed', [field]: 'value' },
            externalUserId
          );

          expect(response.statusCode).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.errors).toEqual({
            [field]: `${field} cannot be modified`,
          });
          expect(await getUser(externalUserId)).toEqual(before);
        }
      );
    });

    describe('The body contains invalid values', () => {
      it('Should respond with code 400 and list every invalid field', async () => {
        const before = await getUser(externalUserId);

        const response = await patchProfile(
          ['external'],
          { name: '   ', phone: '5512345678', municipality: 42 },
          externalUserId
        );

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual({
          name: 'name or last name must be a non-empty string.',
          phone: 'phone must be a valid phone number.',
          municipality: 'municipality must be a non-empty string.',
        });
        expect(await getUser(externalUserId)).toEqual(before);
      });
    });

    describe('The body is empty', () => {
      it('Should respond with code 400', async () => {
        const response = await patchProfile(['external'], {}, externalUserId);

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual({
          body: 'At least one field is required',
        });
      });
    });

    describe('The body is not an object', () => {
      it('Should respond with code 400', async () => {
        const response = await patchProfile(
          ['external'],
          [{ name: 'Ana' }],
          externalUserId
        );

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual({
          body: 'Request body must be an object',
        });
      });
    });

    describe('The user does not exist', () => {
      it.each([['external'], ['admin']])(
        'Should respond with code 404 for a %s token',
        async (role) => {
          const response = await patchProfile(
            [role],
            { name: 'Ana' },
            NONEXISTENT_USER_ID
          );

          expect(response.statusCode).toBe(404);
          expect(response.body.error).toBe('user not found');
        }
      );
    });
  });

  describe('ExternalUserModel.updateProfile', () => {
    it('Should update both tables and return true', async () => {
      const result = await ExternalUserModel.updateProfile(
        externalUserId,
        { last_name: 'Model' },
        { state: 'Jalisco' }
      );

      expect(result).toBe(true);
      expect((await getUser(externalUserId)).last_name).toBe('Model');
      expect((await getAddress(externalUserId)).state).toBe('Jalisco');
    });

    it('Should return false when the user does not exist', async () => {
      const result = await ExternalUserModel.updateProfile(
        NONEXISTENT_USER_ID,
        { name: 'Ana' },
        { state: 'Jalisco' }
      );

      expect(result).toBe(false);
    });
  });

  describe('ProfileModel.updateProfileById', () => {
    it('Should update the user row and return its id', async () => {
      const userQuery = fakeQuery({
        data: { user_id: STAFF_USER_ID },
        error: null,
      });
      jest.spyOn(supabase, 'from').mockReturnValue(userQuery);

      const result = await ProfileModel.updateProfileById(STAFF_USER_ID, {
        last_name: 'Model',
      });

      expect(result).toEqual({ user_id: STAFF_USER_ID });
      expect(userQuery.update).toHaveBeenCalledWith({ last_name: 'Model' });
      expect(userQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(userQuery.select).toHaveBeenCalledWith('user_id');
    });

    it('Should return null when the user does not exist', async () => {
      const result = await ProfileModel.updateProfileById(NONEXISTENT_USER_ID, {
        name: 'Luis',
      });

      expect(result).toBeNull();
    });

    it('Should throw when the column does not exist', async () => {
      await expect(
        ProfileModel.updateProfileById(NONEXISTENT_USER_ID, {
          not_a_column: 'x',
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/profile/:userId/edit - returns what PATCH can edit', () => {
    it('Should return the address an external user just updated', async () => {
      await patchProfile(
        ['external'],
        { name: 'Paula', municipality: 'Zapopan' },
        externalUserId
      );

      const response = await getEditableProfile(['external'], externalUserId);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      const user = await getUser(externalUserId);
      expect(response.body.data).toEqual({
        user_id: externalUserId,
        name: 'Paula',
        last_name: user.last_name,
        phone: user.phone,
        address: await getAddress(externalUserId),
      });
      expect(response.body.data.address.municipality).toBe('Zapopan');
    });

    it('Should not return an address for a user with staff and external roles', async () => {
      const response = await getEditableProfile(
        ['external', 'internal'],
        externalUserId
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.data).not.toHaveProperty('address');
    });

    it.each([['admin'], ['internal']])(
      'Should only read the user row for an %s user',
      async (role) => {
        const userQuery = fakeQuery({
          data: {
            user_id: STAFF_USER_ID,
            name: 'Staff',
            last_name: 'User',
            phone: null,
          },
          error: null,
        });
        const from = jest.spyOn(supabase, 'from').mockReturnValue(userQuery);

        const response = await getEditableProfile([role], STAFF_USER_ID);

        expect(response.statusCode).toBe(200);
        expect(from).toHaveBeenCalledTimes(1);
        expect(from).toHaveBeenCalledWith('user');
        expect(response.body.data).toEqual({
          user_id: STAFF_USER_ID,
          name: 'Staff',
          last_name: 'User',
          phone: null,
        });
      }
    );

    it('Should respond with code 403 for another user profile', async () => {
      const response = await getEditableProfile(
        ['external'],
        externalUserId,
        STAFF_USER_ID
      );

      expect(response.statusCode).toBe(403);
      expect(response.body.error).toBe('You do not have permission');
    });

    it('Should respond with code 404 when the user does not exist', async () => {
      const response = await getEditableProfile(
        ['external'],
        NONEXISTENT_USER_ID
      );

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/profile/:userId - G-13 response is unchanged', () => {
    it('Should still return the created_at and email the profile tab uses', async () => {
      const response = await request(app)
        .get(`/api/profile/${externalUserId}`)
        .set(
          'Authorization',
          `Bearer ${tokenFor(['external'], externalUserId)}`
        );

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('created_at');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('address');
    });
  });

  // Runs last because it soft-deletes the test user
  describe('The user was soft-deleted', () => {
    it('Should respond with code 404 and not update the row', async () => {
      await supabase
        .from('user')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', externalUserId);

      const response = await patchProfile(
        ['external'],
        { name: 'Elena' },
        externalUserId
      );

      expect(response.statusCode).toBe(404);
      expect((await getUser(externalUserId)).name).not.toBe('Ghost');
    });
  });
});
