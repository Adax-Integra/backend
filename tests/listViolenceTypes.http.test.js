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

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'r07-isolated-test-secret-not-for-production';

afterAll(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

const violenceTypes = [
  {
    violence_id: '123e4567-e89b-42d3-a456-426614174000',
    description: 'Test violence type',
    severity: 5,
  },
];

const controllerMock = {
  assignViolenceTypes: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: { caseId: req.params.caseId, violenceIds: [] },
    })
  ),
  getAssignedViolenceTypes: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
    })
  ),
  listViolenceTypes: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: violenceTypes,
    })
  ),
};

jest.unstable_mockModule(
  '../Source/Controllers/violenceType.controller.js',
  () => ({ default: controllerMock })
);

// Mock unrelated case operations to avoid accessing Supabase.
jest.unstable_mockModule('../Source/Controllers/case.controller.js', () => ({
  default: {
    listCases: jest.fn(),
    getCaseById: jest.fn(),
    getCasesByUser: jest.fn(),
    closeCase: jest.fn(),
  },
}));

const { default: caseRoutes } = await import('../Source/Routes/case.routes.js');

const app = express();
app.use('/api', caseRoutes);

const endpoint = '/api/violence-types';

function createToken(roles) {
  return jwt.sign(
    {
      user_id: '123e4567-e89b-42d3-a456-426614174000',
      roles,
    },
    process.env.JWT_SECRET
  );
}

describe('R-07: violence types HTTP security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 without a token', async () => {
    const response = await request(app).get(endpoint);

    expect(response.statusCode).toBe(401);
    expect(controllerMock.listViolenceTypes).not.toHaveBeenCalled();
  });

  it('should return 401 with an invalid token', async () => {
    const response = await request(app)
      .get(endpoint)
      .set('Authorization', 'Bearer invalid-token');

    expect(response.statusCode).toBe(401);
    expect(controllerMock.listViolenceTypes).not.toHaveBeenCalled();
  });

  it('should return 403 for external users', async () => {
    const response = await request(app)
      .get(endpoint)
      .set('Authorization', `Bearer ${createToken(['external'])}`);

    expect(response.statusCode).toBe(403);
    expect(controllerMock.listViolenceTypes).not.toHaveBeenCalled();
  });

  it('should allow internal users', async () => {
    const response = await request(app)
      .get(endpoint)
      .set('Authorization', `Bearer ${createToken(['internal'])}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(violenceTypes);
    expect(controllerMock.listViolenceTypes).toHaveBeenCalledTimes(1);
  });

  it('should allow administrators', async () => {
    const response = await request(app)
      .get(endpoint)
      .set('Authorization', `Bearer ${createToken(['admin'])}`);

    expect(response.statusCode).toBe(200);
    expect(controllerMock.listViolenceTypes).toHaveBeenCalledTimes(1);
  });
});

describe('R-07: assignment endpoints HTTP security', () => {
  const caseId = '123e4567-e89b-42d3-a456-426614174000';
  const url = `/api/cases/${caseId}/violence-types`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET should reject unauthenticated requests', async () => {
    const response = await request(app).get(url);

    expect(response.statusCode).toBe(401);
    expect(controllerMock.getAssignedViolenceTypes).not.toHaveBeenCalled();
  });

  it('GET should reject external users', async () => {
    const response = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${createToken(['external'])}`);

    expect(response.statusCode).toBe(403);
    expect(controllerMock.getAssignedViolenceTypes).not.toHaveBeenCalled();
  });

  it('GET should allow internal users', async () => {
    const response = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${createToken(['internal'])}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(controllerMock.getAssignedViolenceTypes).toHaveBeenCalledTimes(1);
  });

  it('PATCH should reject unauthenticated requests', async () => {
    const response = await request(app).patch(url).send({ violenceIds: [] });

    expect(response.statusCode).toBe(401);
    expect(controllerMock.assignViolenceTypes).not.toHaveBeenCalled();
  });

  it('PATCH should reject external users', async () => {
    const response = await request(app)
      .patch(url)
      .set('Authorization', `Bearer ${createToken(['external'])}`)
      .send({ violenceIds: [] });

    expect(response.statusCode).toBe(403);
    expect(controllerMock.assignViolenceTypes).not.toHaveBeenCalled();
  });

  it('PATCH should allow internal users', async () => {
    const response = await request(app)
      .patch(url)
      .set('Authorization', `Bearer ${createToken(['internal'])}`)
      .send({ violenceIds: [] });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.caseId).toBe(caseId);
    expect(controllerMock.assignViolenceTypes).toHaveBeenCalledTimes(1);
  });
});
