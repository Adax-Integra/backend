import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
} from '@jest/globals';

import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Temporary env only for these tests (saved and restored at the end).
const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
};

process.env.JWT_SECRET = 'g13-test-only-secret';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-key';

afterAll(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

// Mock the model so the route runs without the database.
const getProfileByUserIdMock = jest.fn();

jest.unstable_mockModule('../Data/Models/profile.model.js', () => ({
  default: { getProfileByUserId: getProfileByUserIdMock },
}));

// The auth middleware validates the session against the database, so the
// token model is mocked to keep these route tests isolated from Supabase.
const isActiveMock = jest.fn();

jest.unstable_mockModule('../Data/Models/authToken.model.js', () => ({
  default: { isActive: isActiveMock },
}));

// Import the real router (with its real controller and middlewares).
const { default: profileRoutes } =
  await import('../Source/Routes/profile.routes.js');

const app = express();
app.use(express.json());
app.use('/api', profileRoutes);

const ownerId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';

const tokenFor = (roles) =>
  jwt.sign({ user_id: ownerId, roles }, process.env.JWT_SECRET);

describe('G-13: GET /profile/:userId (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default the session is active, so auth passes and the route runs.
    isActiveMock.mockResolvedValue(true);
  });

  // No token -> 401.
  it('returns 401 without a token', async () => {
    const response = await request(app).get(`/api/profile/${ownerId}`);

    expect(response.statusCode).toBe(401);
    expect(getProfileByUserIdMock).not.toHaveBeenCalled();
  });

  // The owner asks for their own profile -> 200.
  it('returns 200 and the profile of the token user', async () => {
    getProfileByUserIdMock.mockResolvedValue({ user_id: ownerId, name: 'Ana' });

    const response = await request(app)
      .get(`/api/profile/${ownerId}`)
      .set('Authorization', `Bearer ${tokenFor(['external'])}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.user_id).toBe(ownerId);
    expect(getProfileByUserIdMock).toHaveBeenCalledWith(ownerId);
  });

  // Another user's id -> 403 for every role, admins included.
  it.each([['external'], ['internal'], ['admin']])(
    'returns 403 when a %s asks for another user id',
    async (role) => {
      const response = await request(app)
        .get(`/api/profile/${otherId}`)
        .set('Authorization', `Bearer ${tokenFor([role])}`);

      expect(response.statusCode).toBe(403);
      expect(getProfileByUserIdMock).not.toHaveBeenCalled();
    }
  );
});
