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

// User A has 1 case and is tested in the successful response test
const userA = 'f776c596-e385-4e11-8e1e-554fac5da3f0';

// User B has no cases and is tested in the empty response test
const userB = 'ad91b33a-7de4-493b-8af9-dbaffe0b8d1f';

// User C does not exist and is tested in the nonexistent user test
const userC = '11111111-1111-4111-8111-111111111111';

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
          `/api/internal-users/${userA}/allCases`
        );

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('It contains an invalid authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userA}/allCases`)
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
          .get(`/api/internal-users/${userA}/allCases`)
          .set('Authorization', `Bearer ${externalToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains a valid userId with cases', () => {
      it('Should respond with code 200 and the user cases', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userA}/allCases`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: [
            {
              caseId: '8c097b2f-5418-45ba-ab5f-9fc866fbe778',
              caseNumber: null,
              state: 'Abierto',
              userName: 'Carmen Solis',
              violenceTypes: [],
              assignedUsers: [],
              updatedAt: '2026-10-08T04:59:49.671Z',
            },
          ],
        });
      });
    });

    describe('It contains a valid userId that does not exist', () => {
      it('Should respond with code 200 and an empty data array', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userC}/allCases`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: [],
        });
      });
    });

    describe('It contains a valid userId without cases', () => {
      it('Should respond with code 200 and an empty data array', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userB}/allCases`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: [],
        });
      });
    });
  });
});
