import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Valid UUID with no assigned cases
const internalUserId = '22222222-2222-4222-8222-222222222222';

const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET);
const internalToken = sign({ user_id: internalUserId, roles: ['internal'] });
const externalToken = sign({ user_id: internalUserId, roles: ['external'] });

describe('Unit tests for V-12', () => {
  describe('GET /api/cases/assigned - list the cases assigned to the collaborator', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get('/api/cases/assigned');

        expect(response.statusCode).toBe(401);
      });
    });

    describe('It contains a token without an allowed role', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get('/api/cases/assigned')
          .set('Authorization', `Bearer ${externalToken}`);

        expect(response.statusCode).toBe(403);
      });
    });

    describe('It contains an invalid status', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/cases/assigned?status=pending')
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.errors.status).toBeDefined();
      });
    });

    describe('It contains a limit above the maximum', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/cases/assigned?limit=101')
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.errors.limit).toBeDefined();
      });
    });

    describe('It is not read as a caseId', () => {
      it('Should respond with the paginated list shape', async () => {
        const response = await request(app)
          .get('/api/cases/assigned?status=all&page=1&limit=20')
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.cases)).toBe(true);
        expect(response.body.data).toMatchObject({ page: 1, limit: 20 });
      });
    });
  });
});
