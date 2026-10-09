import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Generate a test token with the admin role
const adminToken = jwt.sign(
  { user_id: 'test-admin-user', roles: ['admin'] },
  process.env.JWT_SECRET
);

// Generate a test token with the internal role
const internalToken = jwt.sign(
  { user_id: 'test-internal-user', roles: ['internal'] },
  process.env.JWT_SECRET
);

// G-06: Tests access to the list of internal collaborators
describe('Unit tests for G-06', () => {
  describe('GET /api/internal-users - list internal accounts', () => {
    // Verify that an admin can access the list
    describe('The user is an admin', () => {
      it('Should respond with code 200 and a list', async () => {
        const response = await request(app)
          .get('/api/internal-users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    // Verify that an internal user cannot access the list
    describe('The user is not an admin', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get('/api/internal-users')
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(403);
      });
    });

    // Verify that requests without a token are rejected
    describe('There is no token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get('/api/internal-users');

        expect(response.statusCode).toBe(401);
      });
    });
  });
});
