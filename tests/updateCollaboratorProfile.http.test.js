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

process.env.JWT_SECRET = 'g18-test-only-secret';
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

// Mock the UseCase so the route runs without the database.
const executeMock = jest.fn();

jest.unstable_mockModule(
  '../Domain/UseCases/updateCollaboratorProfile.usecase.js',
  () => ({
    default: class {
      execute(...args) {
        return executeMock(...args);
      }
    },
  })
);

// Import the real router (with its real controller and middlewares).
const { default: internalUserRoutes } =
  await import('../Source/Routes/internalUser.routes.js');

const app = express();
app.use(express.json());
app.use('/api', internalUserRoutes);

const userId = '11111111-1111-4111-8111-111111111111';
const path = `/api/internal-users/${userId}`;

const adminToken = jwt.sign(
  { user_id: 'admin-user', roles: ['admin'] },
  process.env.JWT_SECRET
);
const internalToken = jwt.sign(
  { user_id: 'internal-user', roles: ['internal'] },
  process.env.JWT_SECRET
);

describe('G-18: PATCH /internal-users/:userId (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // No token -> 401.
  it('returns 401 without a token', async () => {
    const response = await request(app)
      .patch(path)
      .send({ profile: { name: 'Ana Maria' } });

    expect(response.statusCode).toBe(401);
    expect(executeMock).not.toHaveBeenCalled();
  });

  // Authenticated internal (not admin) -> 403.
  it('returns 403 for a non-admin role', async () => {
    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${internalToken}`)
      .send({ profile: { name: 'Ana Maria' } });

    expect(response.statusCode).toBe(403);
    expect(executeMock).not.toHaveBeenCalled();
  });

  // Valid request -> 200 with the updated collaborator.
  it('returns 200 and the updated collaborator', async () => {
    executeMock.mockResolvedValue({
      user_id: userId,
      name: 'Ana Maria',
      last_name: 'Lopez',
      email: 'ana.lopez@adax.com',
    });

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ profile: { name: 'Ana Maria' } });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Ana Maria');
    expect(executeMock).toHaveBeenCalledWith('admin-user', userId, {
      profile: { name: 'Ana Maria' },
    });
  });

  // Validation error from the use case -> 400 with the field details.
  it('returns 400 on a validation error', async () => {
    const validation = new Error('profile.phone cannot be modified');
    validation.status = 400;
    validation.details = {
      'profile.phone': 'profile.phone cannot be modified',
    };
    executeMock.mockRejectedValue(validation);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ profile: { phone: '5512345678' } });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual({
      'profile.phone': 'profile.phone cannot be modified',
    });
  });

  // Email already in use -> 409.
  it('returns 409 when the email is already registered', async () => {
    const conflict = new Error('This email is already registered');
    conflict.status = 409;
    executeMock.mockRejectedValue(conflict);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ profile: { email: 'taken@adax.com' } });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('This email is already registered');
  });

  // Missing collaborator -> 404.
  it('returns 404 when the collaborator does not exist', async () => {
    const notFound = new Error('Collaborator not found');
    notFound.status = 404;
    executeMock.mockRejectedValue(notFound);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ profile: { name: 'Ana Maria' } });

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
