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

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
};

process.env.JWT_SECRET = 'b02-test-only-secret';
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
  '../Domain/UseCases/reviewVerification.usecase.js',
  () => ({
    default: class {
      execute(...args) {
        return executeMock(...args);
      }
    },
  })
);

// The auth middleware validates the session against the database, so the
// token model is mocked to keep these route tests isolated from Supabase.
const isActiveMock = jest.fn();

jest.unstable_mockModule('../Data/Models/authToken.model.js', () => ({
  default: { isActive: isActiveMock },
}));

const { default: internalUserRoutes } =
  await import('../Source/Routes/internalUser.routes.js');

const app = express();
app.use(express.json());
app.use('/api', internalUserRoutes);

const userId = '11111111-1111-4111-8111-111111111111';
const path = `/api/internal-users/external-users/${userId}/verification`;

const adminToken = jwt.sign(
  { user_id: 'admin-user', roles: ['admin'] },
  process.env.JWT_SECRET
);
const internalToken = jwt.sign(
  { user_id: 'internal-user', roles: ['internal'] },
  process.env.JWT_SECRET
);
const externalToken = jwt.sign(
  { user_id: 'external-user', roles: ['external'] },
  process.env.JWT_SECRET
);

describe('B-02: PATCH /internal-users/external-users/:userId/verification (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isActiveMock.mockResolvedValue(true);
  });

  it('returns 401 without a token', async () => {
    const response = await request(app)
      .patch(path)
      .send({ status: 'VERIFICADO' });

    expect(response.statusCode).toBe(401);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('returns 403 for an external role', async () => {
    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${externalToken}`)
      .send({ status: 'VERIFICADO' });

    expect(response.statusCode).toBe(403);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('returns 200 when an internal user approves', async () => {
    executeMock.mockResolvedValue({
      user_id: userId,
      verification_status: 'VERIFICADO',
    });

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${internalToken}`)
      .send({ status: 'VERIFICADO' });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.verification_status).toBe('VERIFICADO');
    expect(executeMock).toHaveBeenCalledWith('internal-user', userId, {
      status: 'VERIFICADO',
    });
  });

  it('returns 400 on an invalid status', async () => {
    const validation = new Error(
      'status must be one of: VERIFICADO, NO_VERIFICADO'
    );
    validation.status = 400;
    executeMock.mockRejectedValue(validation);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'NOPE' });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 409 when the account is not under review', async () => {
    const conflict = new Error('The account is not under review');
    conflict.status = 409;
    executeMock.mockRejectedValue(conflict);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'VERIFICADO' });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('returns 404 when the external user does not exist', async () => {
    const notFound = new Error('External user not found');
    notFound.status = 404;
    executeMock.mockRejectedValue(notFound);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'VERIFICADO' });

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
