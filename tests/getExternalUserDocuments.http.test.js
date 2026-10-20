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

// Use a temporary JWT secret exclusively for these tests.
const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'v13-test-only-secret';

afterAll(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

const ok = (req, res) => res.status(200).json({ success: true });

// Mock the controller to prevent real database or storage operations.
const controllerMock = {
  getAllCasesFromUser: jest.fn(ok),
  createCaseForExternalUser: jest.fn(ok),
  registerExternalUser: jest.fn(ok),
  listExternalUsers: jest.fn(ok),
  getExternalProfile: jest.fn(ok),
  updateExternalProfile: jest.fn(ok),
  getExternalUserDocuments: jest.fn(ok),
  createCollaborator: jest.fn(ok),
  listActivityLog: jest.fn(ok),
  listCollaborators: jest.fn(ok),
  getCollaboratorDetail: jest.fn(ok),
  getCollaboratorCases: jest.fn(ok),
};

jest.unstable_mockModule(
  '../Source/Controllers/internalUser.controller.js',
  () => ({
    default: controllerMock,
  })
);

// Import the real router with its existing middlewares.
const { default: internalUserRoutes } =
  await import('../Source/Routes/internalUser.routes.js');

const app = express();
app.use('/api', internalUserRoutes);

const externalUserId = '123e4567-e89b-42d3-a456-426614174000';
const callerId = '987e6543-e21b-42d3-a456-426614174000';
const path = `/api/internal-users/external-users/${externalUserId}/documents`;

function tokenFor(roles) {
  return jwt.sign({ user_id: callerId, roles }, process.env.JWT_SECRET);
}

describe('V-13: record documents HTTP security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get(path);

    expect(response.statusCode).toBe(401);
    expect(controllerMock.getExternalUserDocuments).not.toHaveBeenCalled();
  });

  it('should return 403 for an external user', async () => {
    const response = await request(app)
      .get(path)
      .set('Authorization', `Bearer ${tokenFor(['external'])}`);

    expect(response.statusCode).toBe(403);
    expect(controllerMock.getExternalUserDocuments).not.toHaveBeenCalled();
  });

  it('should allow an internal user', async () => {
    const response = await request(app)
      .get(path)
      .set('Authorization', `Bearer ${tokenFor(['internal'])}`);

    expect(response.statusCode).toBe(200);
    expect(controllerMock.getExternalUserDocuments).toHaveBeenCalledTimes(1);
  });

  it('should allow an admin', async () => {
    const response = await request(app)
      .get(path)
      .set('Authorization', `Bearer ${tokenFor(['admin'])}`);

    expect(response.statusCode).toBe(200);
    expect(controllerMock.getExternalUserDocuments).toHaveBeenCalledTimes(1);
  });

  it('should not be confused with the G-07 profile route', async () => {
    await request(app)
      .get(path)
      .set('Authorization', `Bearer ${tokenFor(['admin'])}`);

    expect(controllerMock.getExternalProfile).not.toHaveBeenCalled();
  });
});
