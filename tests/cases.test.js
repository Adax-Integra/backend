import app from '../Source/app.js';
import request from 'supertest';

/* 
Unit testing for all user stories related to cases
Each User Story should have its own 'describe' block, inside it, there should 
be different 'it' blocks of different functions
*/

describe('Unit tests for V-10', () => {
  describe('GET /api/internal-users/{userId}/allCases - get all the cases from a user', () => {
    describe('It contains an emtpy userId', () => {
      it('Should ask for a valid user id', async () => {
        const response = await request(app).get(
          '/api/internal-users//allCases'
        );
        expect(response.statusCode).toBe(404);
      });
    });
  });
});
