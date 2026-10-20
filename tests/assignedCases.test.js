import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// V-12 tests query validation and response shape without requiring a stored
// session or pre-existing assigned cases in Supabase.
jest.unstable_mockModule('../Data/Models/authToken.model.js', () => ({
  default: { isActive: jest.fn().mockResolvedValue(true) },
}));

jest.unstable_mockModule('../Data/Models/case.model.js', () => ({
  default: {
    findPageByAssignedUser: jest.fn().mockResolvedValue({
      cases: [],
      total: 0,
    }),
  },
}));

const { default: app } = await import('../Source/app.js');

const internalUserId = '22222222-2222-4222-8222-222222222222';

const tokenFor = (roles) =>
  jwt.sign(
    {
      user_id: internalUserId,
      roles,
    },
    process.env.JWT_SECRET
  );

const authHeader = (roles = ['internal']) =>
  `Bearer ${tokenFor(roles)}`;

describe('Unit tests for V-12', () => {
  describe('GET /api/cases/assigned', () => {
    it('responds with 401 when authorization is missing', async () => {
      const response = await request(app).get('/api/cases/assigned');

      expect(response.statusCode).toBe(401);
    });

    it('responds with 403 when the role is not allowed', async () => {
      const response = await request(app)
        .get('/api/cases/assigned')
        .set('Authorization', authHeader(['external']));

      expect(response.statusCode).toBe(403);
    });

    it('responds with 400 when status is invalid', async () => {
      const response = await request(app)
        .get('/api/cases/assigned?status=pending')
        .set('Authorization', authHeader());

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.status).toBeDefined();
    });

    it('responds with 400 when limit exceeds the maximum', async () => {
      const response = await request(app)
        .get('/api/cases/assigned?limit=101')
        .set('Authorization', authHeader());

      expect(response.statusCode).toBe(400);
      expect(response.body.errors.limit).toBeDefined();
    });

    it('returns a paginated list when assigned is not read as a caseId', async () => {
      const response = await request(app)
        .get('/api/cases/assigned?status=all&page=1&limit=20')
        .set('Authorization', authHeader());

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.cases)).toBe(true);
      expect(response.body.data).toMatchObject({ page: 1, limit: 20 });
    });
  });
});
