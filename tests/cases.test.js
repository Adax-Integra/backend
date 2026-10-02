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
          .set('Authorization', `Bearer ${testToken}`);

        expect(response.statusCode).toBe(404);
      });
    });

    describe('Contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/internal-users/1222155/allCases')
          .set('Authorization', `Bearer ${testToken}`);

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
