import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// The endpoint tests should not depend on a pre-existing session or case in
// the shared Supabase project. Those concerns are covered by their own tests.
jest.unstable_mockModule('../Data/Models/authToken.model.js', () => ({
  default: { isActive: jest.fn().mockResolvedValue(true) },
}));

const userWithCases = 'f776c596-e385-4e11-8e1e-554fac5da3f0';
const userWithoutCases = '7012f43a-a7de-4858-87c0-e2cb3e13e987';
const nonexistentUser = '11111111-1111-4111-8111-111111111111';
const firstCaseId = '83a32685-a9d4-4acb-8e2d-e2d723df1ce0';
const secondCaseId = '8c097b2f-5418-45ba-ab5f-9fc866fbe778';

const caseRows = [
  {
    case_id: firstCaseId,
    case_number: 'CAS-2026-0002',
    state: 'Closed',
    updated_at: '2026-10-13T06:01:57.241Z',
    record: {
      user: {
        name: 'Carmen',
        last_name: 'Solis',
      },
    },
    case_violence: [
      {
        deleted_at: null,
        violence_types: {
          description: 'Sexual',
          severity: 8,
          deleted_at: null,
        },
      },
    ],
    case_assignment: [],
  },
  {
    case_id: secondCaseId,
    case_number: 'CAS-2026-0001',
    state: 'Closed',
    updated_at: '2026-10-13T06:01:57.241Z',
    record: {
      user: {
        name: 'Carmen',
        last_name: 'Solis',
      },
    },
    case_violence: [
      {
        deleted_at: null,
        violence_types: {
          description: 'Económica',
          severity: 4,
          deleted_at: null,
        },
      },
      {
        deleted_at: null,
        violence_types: {
          description: 'Familiar',
          severity: 4,
          deleted_at: null,
        },
      },
    ],
    case_assignment: [],
  },
];

jest.unstable_mockModule('../Data/Models/cases.model.js', () => ({
  default: {
    getAllCasesFromUser: jest.fn(async (userId) =>
      userId === userWithCases ? caseRows : []
    ),
  },
}));

const { default: app } = await import('../Source/app.js');

const tokenFor = (roles) =>
  jwt.sign(
    {
      user_id: 'test-internal-user',
      roles,
    },
    process.env.JWT_SECRET
  );

const authHeader = (roles = ['internal']) =>
  `Bearer ${tokenFor(roles)}`;

describe('Unit tests for V-10', () => {
  describe('GET /api/internal-users/{userId}/allCases', () => {
    it('responds with 404 when userId is empty', async () => {
      const response = await request(app)
        .get('/api/internal-users//allCases')
        .set('Authorization', authHeader());

      expect(response.statusCode).toBe(404);
    });

    it('responds with 400 when userId is not a UUID', async () => {
      const response = await request(app)
        .get('/api/internal-users/1222155/allCases')
        .set('Authorization', authHeader());

      expect(response.statusCode).toBe(400);
    });

    it('responds with 401 when authorization is missing', async () => {
      const response = await request(app).get(
        `/api/internal-users/${userWithCases}/allCases`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Token is required.');
    });

    it('responds with 401 when authorization is invalid', async () => {
      const response = await request(app)
        .get(`/api/internal-users/${userWithCases}/allCases`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token.');
    });

    it('responds with 403 when the role is not allowed', async () => {
      const response = await request(app)
        .get(`/api/internal-users/${userWithCases}/allCases`)
        .set('Authorization', authHeader(['external']));

      expect(response.statusCode).toBe(403);
      expect(response.body.error).toBe('You do not have permission');
    });

    it('returns the user cases', async () => {
      const response = await request(app)
        .get(`/api/internal-users/${userWithCases}/allCases`)
        .set('Authorization', authHeader());

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [
          {
            caseId: firstCaseId,
            caseNumber: 'CAS-2026-0002',
            state: 'Closed',
            userName: 'Carmen Solis',
            violenceTypes: ['Sexual'],
            assignedUsers: [],
            urgency: 'Alta',
            updatedAt: '2026-10-13T06:01:57.241Z',
          },
          {
            caseId: secondCaseId,
            caseNumber: 'CAS-2026-0001',
            state: 'Closed',
            userName: 'Carmen Solis',
            violenceTypes: ['Económica', 'Familiar'],
            assignedUsers: [],
            urgency: 'Media',
            updatedAt: '2026-10-13T06:01:57.241Z',
          },
        ],
      });
    });

    it.each([
      ['a nonexistent user', nonexistentUser],
      ['a user without cases', userWithoutCases],
    ])('returns an empty list for %s', async (_description, userId) => {
      const response = await request(app)
        .get(`/api/internal-users/${userId}/allCases`)
        .set('Authorization', authHeader());

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });
  });
});
