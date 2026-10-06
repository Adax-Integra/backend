import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Internal users are the only ones allowed to view and close cases (V-11)
const testToken = jwt.sign(
  { user_id: 'test-internal-user', roles: ['internal'] },
  process.env.JWT_SECRET
);

const authHeader = () => ['Bearer', testToken].join(' ');

// in this test we want to use a case that is open and can be closed it will be left in "Closed" state so if we want
// to try again we must  reset it to "Open" in Supabase or change the ID to one that is still open.

const OPEN_CASE_TO_CLOSE = '9c6b5dca-db09-43dd-bb4e-1a7d1b0f81fc';

// in this case we use a case that was already clsed and want to make sure the "already closed" (409) check works good
const ALREADY_CLOSED_CASE = '597b73b9-e4d2-4b7c-9094-6ed222d96aa4';

// In case one of the previous cases is already closed I place this "Spare case" ids
// OPEN_CASE_TO_CLOSE / ALREADY_CLOSED_CASE are not in the right state.
// d819031c-01a8-4b0c-b74c-132417baa4f6 --> Open
// 0dbbf20a-271d-4135-a2de-833237b230c9 --> Open
// 2b8882aa-1247-4cc7-abaa-f52488131726 --> Closed

const NONEXISTENT_CASE_ID = '11111111-1111-4111-8111-111111111111';

// Unit testing for all user stories related to the case detail view and the close-case action (V-11)

describe('Unit tests for V-11', () => {
  describe('GET /api/cases/{caseId} - get the full detail of a case', () => {
    describe('It contains an invalid caseId', () => {
      it('Should respond with code 400', async () => {
        // "testcase123" is not a valid UUID  so the validator should reject it before any database call is made
        const response = await request(app)
          .get('/api/cases/testcase123')
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(400);
      });
    });

    describe('It contains a valid caseId that exists', () => {
      it('Should respond with code 200 and the case detail', async () => {
        // for this test we use a  Closed case  on purpose, since this is a test only to get the details of a case
        // so no DB changes are made
        const response = await request(app)
          .get(`/api/cases/${ALREADY_CLOSED_CASE}`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty(
          'case_id',
          ALREADY_CLOSED_CASE
        );
      });
    });

    describe('It contains a valid caseId that does not exist', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get(`/api/cases/${NONEXISTENT_CASE_ID}`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(400);
      });
    });
  });

  describe('PATCH /api/cases/{caseId}/close - close a case', () => {
    describe('It contains an invalid caseId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .patch('/api/cases/testcase123/close')
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(400);
      });
    });

    describe('It contains a caseId that is already Closed', () => {
      it('Should respond with code 409', async () => {
        // Since we implemented an  atomic update with Patch http method it only closes a case if it is not already Closed
        // so this must fail with a 409 error
        const response = await request(app)
          .patch(`/api/cases/${ALREADY_CLOSED_CASE}/close`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(409);
      });
    });

    // As I said before for this test we close a case that is Open and can be closed, so if we want to try again
    //  we must reset it to "Open" in Supabase or change the ID to one that is still open
    describe('It contains a valid caseId that is Open', () => {
      it('Should respond with code 200 and the updated state', async () => {
        const response = await request(app)
          .patch(`/api/cases/${OPEN_CASE_TO_CLOSE}/close`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.state).toBe('Closed');
      });
    });
  });
});
