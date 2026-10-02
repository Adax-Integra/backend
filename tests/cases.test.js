import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const testToken = jwt.sign(
  {
    user_id: 'test-internal-user',
    roles: ['internal'],
  },
  process.env.JWT_SECRET
);
const validUserId = '11111111-1111-4111-8111-111111111111';
const authHeader = () => ['Bearer', testToken].join(' ');

/*
Unit testing for all user stories related to cases
Each User Story should have its own 'describe' block, inside it, there should
be different 'describe' blocks
*/

describe('Unit tests for V-10', () => {
  describe('GET /api/internal-users/{userId}/allCases - get all the cases from a user', () => {
    describe('It contains an empty userId', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .get('/api/internal-users//allCases')
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(404);
      });
    });

    describe('Contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/internal-users/1222155/allCases')
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(400);
      });
    });

    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get(
          `/api/internal-users/${validUserId}/allCases`
        );

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('It contains an invalid authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${validUserId}/allCases`)
          .set('Authorization', 'Bearer invalid-token');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('It contains a token for a user without an allowed role', () => {
      it('Should respond with code 403', async () => {
        const externalToken = jwt.sign(
          { user_id: 'test-external-user', roles: ['external'] },
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .get(`/api/internal-users/${validUserId}/allCases`)
          .set('Authorization', `Bearer ${externalToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });
  });
});
