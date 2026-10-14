import { describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';

/*
R-02 integration tests for authentication, ownership and body validation.
None of these requests write to the database. Only HTTP-15 reads Supabase.
createCaseLimiter allows 10 requests per IP and runs after authMiddleware
and ownDataOnly, so only the requests from HTTP-07 onward count (9 total).
*/

// Valid UUID v4 values that do not belong to any user
const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '987e6543-e21b-42d3-a456-426614174000';
const NONEXISTENT_USER_ID = '11111111-1111-4111-8111-111111111111';

const tokenFor = (userId, roles = ['external']) =>
  jwt.sign({ user_id: userId, roles }, process.env.JWT_SECRET);

const urlFor = (userId) => `/api/external-users/${userId}/cases`;

const validBody = {
  writtenDescription: 'Integration test description',
  writtenHelpsWanted: 'Legal advice',
  hasExternalSupport: false,
};

const postCase = (userId, body, token = tokenFor(userId)) =>
  request(app)
    .post(urlFor(userId))
    .set('Authorization', `Bearer ${token}`)
    .send(body);

describe('Integration tests for R-02', () => {
  describe('POST /api/external-users/:userId/cases - authentication', () => {
    it('HTTP-01 responds 401 when there is no token', async () => {
      const response = await request(app).post(urlFor(USER_ID)).send(validBody);

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Token is required.');
    });

    it('HTTP-02 responds 401 when the header does not use Bearer', async () => {
      const response = await request(app)
        .post(urlFor(USER_ID))
        .set('Authorization', 'Token abc')
        .send(validBody);

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Token is required.');
    });

    it('HTTP-03 responds 401 with a malformed token', async () => {
      const response = await postCase(USER_ID, validBody, 'invalid-token');

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('HTTP-04 responds 401 with an expired token', async () => {
      const expired = jwt.sign(
        {
          user_id: USER_ID,
          roles: ['external'],
          exp: Math.floor(Date.now() / 1000) - 60,
        },
        process.env.JWT_SECRET
      );

      const response = await postCase(USER_ID, validBody, expired);

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('HTTP-05 responds 401 with a token signed by another secret', async () => {
      const forged = jwt.sign(
        { user_id: USER_ID, roles: ['external'] },
        'not-the-server-secret-not-the-server-secret'
      );

      const response = await postCase(USER_ID, validBody, forged);

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('HTTP-06 responds 403 when the token belongs to another user', async () => {
      const response = await postCase(
        USER_ID,
        validBody,
        tokenFor(OTHER_USER_ID)
      );

      expect(response.statusCode).toBe(403);
      expect(response.body.error).toBe('You do not have permission');
    });
  });

  describe('POST /api/external-users/:userId/cases - validation', () => {
    it('HTTP-07 responds 400 when userId is not a UUID', async () => {
      const response = await postCase('not-a-uuid', validBody);

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'userId must be a valid UUID',
        errors: null,
      });
    });

    it('HTTP-08 responds 400 with every field when there is no body', async () => {
      const response = await request(app)
        .post(urlFor(USER_ID))
        .set('Authorization', `Bearer ${tokenFor(USER_ID)}`);

      expect(response.statusCode).toBe(400);
      expect(Object.keys(response.body.errors).sort()).toEqual([
        'hasExternalSupport',
        'writtenDescription',
        'writtenHelpsWanted',
      ]);
    });

    it('HTTP-09 responds 400 when the body is an array', async () => {
      const response = await postCase(USER_ID, []);

      expect(response.statusCode).toBe(400);
      expect(response.body.errors).toEqual({
        body: 'Request body must be an object',
      });
    });

    it('HTTP-10 responds 400 when the description is only spaces', async () => {
      const response = await postCase(USER_ID, {
        ...validBody,
        writtenDescription: '    ',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.writtenDescription).toBe(
        'writtenDescription must be a non-empty string.'
      );
    });

    it('HTTP-11 responds 400 when the description is not a string', async () => {
      const response = await postCase(USER_ID, {
        ...validBody,
        writtenDescription: 123,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.writtenDescription).toBe(
        'writtenDescription must be a non-empty string.'
      );
    });

    it('HTTP-12 responds 400 when the description has 5001 characters', async () => {
      const response = await postCase(USER_ID, {
        ...validBody,
        writtenDescription: 'a'.repeat(5001),
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.writtenDescription).toBe(
        'writtenDescription must be at most 5000 characters'
      );
    });

    it('HTTP-13 responds 400 when the help wanted has 401 characters', async () => {
      const response = await postCase(USER_ID, {
        ...validBody,
        writtenHelpsWanted: 'b'.repeat(401),
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.writtenHelpsWanted).toBe(
        'writtenHelpsWanted must be at most 400 characters'
      );
    });

    it('HTTP-14 responds 400 when hasExternalSupport is the text "No"', async () => {
      const response = await postCase(USER_ID, {
        ...validBody,
        hasExternalSupport: 'No',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.hasExternalSupport).toBe(
        'hasExternalSupport must be true or false'
      );
    });
  });

  describe('POST /api/external-users/:userId/cases - record lookup', () => {
    it('HTTP-15 responds 404 when the user has no record', async () => {
      const response = await postCase(NONEXISTENT_USER_ID, validBody);

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Record not found for this user',
        errors: null,
      });
    });
  });

  describe('POST /api/external-users/:userId/cases - known defects', () => {
    // Known defect: the global error handler in app.js answers 500 for the
    // body-parser SyntaxError. Remove .failing once it answers 400
    it.failing('HTTP-16 responds 400 when the JSON is malformed', async () => {
      const response = await request(app)
        .post(urlFor(USER_ID))
        .set('Authorization', `Bearer ${tokenFor(USER_ID)}`)
        .set('Content-Type', 'application/json')
        .send('{"writtenDescription": ');

      expect(response.statusCode).toBe(400);
    });
  });
});
