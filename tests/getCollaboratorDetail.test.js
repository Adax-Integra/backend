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

// Active collaborator that already exists in Supabase
const ACTIVE_COLLABORATOR_ID = 'be9eea63-e720-470a-a5e9-8e7e41c09182';

// Valid UUID that does not belong to any user
const NONEXISTENT_USER_ID = '11111111-1111-4111-8111-111111111111';

// A collaborator with deleted_at filled (inactive account)
const INACTIVE_COLLABORATOR_ID = '33c8aed0-05ec-45d4-b7f3-f0e8e72f272d';
// The user_id of an admin account (it must answer 404, it is not internal)
const ADMIN_USER_ID = '189fa09d-05cd-4b35-961d-3b523f33cd3c';
// A collaborator with at least one row in case_assignment
const COLLABORATOR_WITH_CASES_ID = '83ac77cf-3a89-4ee8-b2f0-8d66507ca2d7';

// Runs the test only when its optional id was provided
const itWhenConfigured = (id) => (id ? it : it.skip);

// G-10: Tests the collaborator detail and the cases assigned to a collaborator
describe('Unit tests for G-10', () => {
  describe('GET /api/internal-users/{userId} - get the detail of a collaborator', () => {
    describe('It contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/internal-users/testuser123')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('It contains a valid userId of an active collaborator', () => {
      it('Should respond with code 200 and the collaborator detail', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${ACTIVE_COLLABORATOR_ID}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty(
          'user_id',
          ACTIVE_COLLABORATOR_ID
        );
        expect(response.body.data).toHaveProperty('role', 'internal');
        expect(response.body.data.is_active).toBe(true);
      });

      it('Should not expose the password or invented fields', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${ACTIVE_COLLABORATOR_ID}`)
          .set('Authorization', `Bearer ${adminToken}`);

        // The password hash must never leave the backend
        expect(response.body.data).not.toHaveProperty('password');
        // The database has no areas or permissions, so they are not returned
        expect(response.body.data).not.toHaveProperty('area');
        expect(response.body.data).not.toHaveProperty('permissions');
      });
    });

    // Inactive collaborators must stay visible: their cases remain until reassigned
    describe('It contains the userId of an inactive collaborator', () => {
      itWhenConfigured(INACTIVE_COLLABORATOR_ID)(
        'Should respond with code 200 and is_active false',
        async () => {
          const response = await request(app)
            .get(`/api/internal-users/${INACTIVE_COLLABORATOR_ID}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(response.statusCode).toBe(200);
          expect(response.body.data.is_active).toBe(false);
        }
      );
    });

    describe('It contains a valid userId that does not exist', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${NONEXISTENT_USER_ID}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    // Only internal accounts can be consulted through this endpoint
    describe('It contains the userId of an admin account', () => {
      itWhenConfigured(ADMIN_USER_ID)(
        'Should respond with code 404',
        async () => {
          const response = await request(app)
            .get(`/api/internal-users/${ADMIN_USER_ID}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(response.statusCode).toBe(404);
        }
      );
    });

    describe('The user is not an admin', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${ACTIVE_COLLABORATOR_ID}`)
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(403);
      });
    });

    describe('There is no token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get(
          `/api/internal-users/${ACTIVE_COLLABORATOR_ID}`
        );

        expect(response.statusCode).toBe(401);
      });
    });

    // The activity-log route is declared before /:userId, so it must not be captured by it
    describe('It requests the activity log route', () => {
      it('Should not be answered as a collaborator detail', async () => {
        const response = await request(app)
          .get('/api/internal-users/activity-log')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).not.toHaveProperty('full_name');
      });
    });
  });

  describe('GET /api/internal-users/{userId}/assigned-cases - list the cases of a collaborator', () => {
    describe('It contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/internal-users/testuser123/assigned-cases')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(400);
      });
    });

    describe('It contains a valid userId of a collaborator', () => {
      it('Should respond with code 200 and the list of cases', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${ACTIVE_COLLABORATOR_ID}/assigned-cases`)
          .set('Authorization', `Bearer ${adminToken}`);

        // The list can be empty, so only the structure is checked here
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.cases)).toBe(true);
        expect(typeof response.body.data.total).toBe('number');
        // The list is capped at 100 cases
        expect(response.body.data.cases.length).toBeLessThanOrEqual(100);
      });
    });

    describe('It contains a collaborator with assigned cases', () => {
      itWhenConfigured(COLLABORATOR_WITH_CASES_ID)(
        'Should respond with the fields of each case card',
        async () => {
          const response = await request(app)
            .get(
              `/api/internal-users/${COLLABORATOR_WITH_CASES_ID}/assigned-cases`
            )
            .set('Authorization', `Bearer ${adminToken}`);

          expect(response.statusCode).toBe(200);
          expect(response.body.data.total).toBeGreaterThan(0);

          // Each card needs the number, state, owner name, violence types and date
          const firstCase = response.body.data.cases[0];
          expect(firstCase).toHaveProperty('case_id');
          expect(firstCase).toHaveProperty('case_number');
          expect(firstCase).toHaveProperty('state');
          expect(firstCase).toHaveProperty('name');
          expect(Array.isArray(firstCase.violence_types)).toBe(true);
          expect(firstCase).toHaveProperty('updated_at');
        }
      );
    });

    // An unknown id must not be answered with an empty list that looks valid
    describe('It contains a valid userId that does not exist', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${NONEXISTENT_USER_ID}/assigned-cases`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(404);
      });
    });

    describe('The user is not an admin', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${ACTIVE_COLLABORATOR_ID}/assigned-cases`)
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(403);
      });
    });

    describe('There is no token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get(
          `/api/internal-users/${ACTIVE_COLLABORATOR_ID}/assigned-cases`
        );

        expect(response.statusCode).toBe(401);
      });
    });
  });
});
