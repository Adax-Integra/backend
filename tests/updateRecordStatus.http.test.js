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

process.env.JWT_SECRET = 'r09-test-only-secret';
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
  '../Domain/UseCases/updateRecordStatus.usecase.js',
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

// Import the real router (with its real controller and middlewares).
const { default: recordRoutes } =
  await import('../Source/Routes/record.routes.js');

const app = express();
app.use(express.json());
app.use('/api', recordRoutes);

const recordId = 'rec-1';
const path = `/api/records/${recordId}/status`;

const adminToken = jwt.sign(
  { user_id: 'admin-user', roles: ['admin'] },
  process.env.JWT_SECRET
);
const externalToken = jwt.sign(
  { user_id: 'external-user', roles: ['external'] },
  process.env.JWT_SECRET
);

describe('R-09: PATCH /records/:recordId/status (HTTP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isActiveMock.mockResolvedValue(true);
  });

  // No token -> 401.
  it('returns 401 without a token', async () => {
    const response = await request(app)
      .patch(path)
      .send({ status: 'EN_REVISION' });

    expect(response.statusCode).toBe(401);
    expect(executeMock).not.toHaveBeenCalled();
  });

  // Authenticated but not staff -> 403.
  it('returns 403 for a non-staff role', async () => {
    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${externalToken}`)
      .send({ status: 'EN_REVISION' });

    expect(response.statusCode).toBe(403);
    expect(executeMock).not.toHaveBeenCalled();
  });

  // Invalid status value -> 400 (controller validation, UseCase not reached).
  it('returns 400 for an invalid status value', async () => {
    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'NOT_A_STATUS' });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(executeMock).not.toHaveBeenCalled();
  });

  // Valid request -> 200 with the updated record.
  it('returns 200 on a valid transition', async () => {
    executeMock.mockResolvedValue({
      record_id: recordId,
      status: 'EN_REVISION',
    });

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'EN_REVISION' });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('EN_REVISION');
    expect(executeMock).toHaveBeenCalledWith({
      recordId,
      newStatus: 'EN_REVISION',
    });
  });

  // Invalid transition -> 409 with the UseCase message.
  it('returns 409 when the transition is not allowed', async () => {
    const conflict = new Error(
      'Cannot change status from COMPLETADO to EN_REVISION.'
    );
    conflict.status = 409;
    executeMock.mockRejectedValue(conflict);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'EN_REVISION' });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(
      'Cannot change status from COMPLETADO to EN_REVISION.'
    );
  });

  // Missing record -> 404.
  it('returns 404 when the record does not exist', async () => {
    const notFound = new Error('Record not found');
    notFound.status = 404;
    executeMock.mockRejectedValue(notFound);

    const response = await request(app)
      .patch(path)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'EN_REVISION' });

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
