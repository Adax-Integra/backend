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
process.env.JWT_SECRET = 'r06-test-only-secret';

afterAll(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

// Mock the controller to prevent real database or storage operations.
const controllerMock = {
  getDocuments: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: {} })
  ),
  uploadDocuments: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: {
        receivedFile: req.files?.identity_document?.[0]?.originalname ?? null,
      },
    })
  ),
};

jest.unstable_mockModule(
  '../Source/Controllers/uploadDocuments.controller.js',
  () => ({
    default: controllerMock,
  })
);

// G-14: the auth middleware checks the token in the database, every token here is active
const isActiveMock = jest.fn();

jest.unstable_mockModule('../Data/Models/authToken.model.js', () => ({
  default: { isActive: isActiveMock },
}));

// Import the real R-06 router with its existing middlewares.
const { default: uploadDocumentsRoutes } =
  await import('../Source/Routes/uploadDocuments.routes.js');

// Create an isolated Express application for testing.
const app = express();
app.use('/api', uploadDocumentsRoutes);

const userId = '123e4567-e89b-42d3-a456-426614174000';
const otherUserId = '987e6543-e21b-42d3-a456-426614174000';

describe('R-06: document upload HTTP security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isActiveMock.mockResolvedValue(true);
  });

  // TEST 1: Reject unauthenticated requests.
  it('should return 401 when no token is provided', async () => {
    const response = await request(app).patch(
      `/api/external-users/${userId}/documents`
    );

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);

    expect(controllerMock.uploadDocuments).not.toHaveBeenCalled();
  });

  // TEST 2: Prevent users from modifying another user's documents.
  it('should return 403 when accessing another user documents', async () => {
    const token = jwt.sign(
      {
        user_id: otherUserId,
        roles: ['external'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .patch(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);

    expect(controllerMock.uploadDocuments).not.toHaveBeenCalled();
  });

  // TEST 3: Allow the authenticated owner to upload a document.
  it('should allow the owner to upload a document', async () => {
    const token = jwt.sign(
      {
        user_id: userId,
        roles: ['external'],
      },
      process.env.JWT_SECRET
    );

    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

    const response = await request(app)
      .patch(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('identity_document', jpegHeader, {
        filename: 'identity.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify that the middleware received the uploaded file.
    expect(response.body.data.receivedFile).toBe('identity.jpg');

    // Verify that the request reached the mocked controller.
    expect(controllerMock.uploadDocuments).toHaveBeenCalledTimes(1);
  });

  // TEST 4: Reject unsupported file types.
  it('should reject unsupported file types', async () => {
    const token = jwt.sign(
      {
        user_id: userId,
        roles: ['external'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .patch(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('identity_document', Buffer.from('test document'), {
        filename: 'document.txt',
        contentType: 'text/plain',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);

    // Invalid files must not reach the controller.
    expect(controllerMock.uploadDocuments).not.toHaveBeenCalled();
  });

  // TEST 5: Reject files larger than 5 MB.
  it('should reject files exceeding the 5 MB limit', async () => {
    const token = jwt.sign(
      {
        user_id: userId,
        roles: ['external'],
      },
      process.env.JWT_SECRET
    );

    const oversizedFile = Buffer.alloc(5 * 1024 * 1024 + 1);

    const response = await request(app)
      .patch(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('identity_document', oversizedFile, {
        filename: 'oversized.png',
        contentType: 'image/png',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('File exceeds the 5 MB limit.');

    // Oversized files must not reach the controller.
    expect(controllerMock.uploadDocuments).not.toHaveBeenCalled();
  });

  // TEST 6: Reject files whose content does not match the declared type.
  it('should reject a file declared as JPEG that is not a JPEG', async () => {
    const token = jwt.sign(
      {
        user_id: userId,
        roles: ['external'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .patch(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('identity_document', Buffer.from('not really a jpeg'), {
        filename: 'identity.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(
      'identity_document: only JPEG or PNG allowed.'
    );

    // Disguised files must not reach the controller.
    expect(controllerMock.uploadDocuments).not.toHaveBeenCalled();
  });

  // TEST 7: Reject PDFs, documents only accept pictures.
  it('should reject a PDF file', async () => {
    const token = jwt.sign(
      {
        user_id: userId,
        roles: ['external'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .patch(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('identity_document', Buffer.from('%PDF-1.4 test document'), {
        filename: 'identity.pdf',
        contentType: 'application/pdf',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(
      'identity_document: only JPEG or PNG allowed.'
    );

    expect(controllerMock.uploadDocuments).not.toHaveBeenCalled();
  });

  // TEST 8: Accept a real PNG.
  it('should accept a file whose content matches its declared type', async () => {
    const token = jwt.sign(
      {
        user_id: userId,
        roles: ['external'],
      },
      process.env.JWT_SECRET
    );

    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const response = await request(app)
      .patch(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proof_of_address', pngHeader, {
        filename: 'address.png',
        contentType: 'image/png',
      });

    expect(response.statusCode).toBe(200);
    expect(controllerMock.uploadDocuments).toHaveBeenCalledTimes(1);
  });
});

describe('R-06: own documents HTTP security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isActiveMock.mockResolvedValue(true);
  });

  function tokenFor(id) {
    return jwt.sign(
      { user_id: id, roles: ['external'] },
      process.env.JWT_SECRET
    );
  }

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get(
      `/api/external-users/${userId}/documents`
    );

    expect(response.statusCode).toBe(401);
    expect(controllerMock.getDocuments).not.toHaveBeenCalled();
  });

  it('should return 403 when reading another user documents', async () => {
    const response = await request(app)
      .get(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${tokenFor(otherUserId)}`);

    expect(response.statusCode).toBe(403);
    expect(controllerMock.getDocuments).not.toHaveBeenCalled();
  });

  it('should allow the owner to read their documents', async () => {
    const response = await request(app)
      .get(`/api/external-users/${userId}/documents`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(response.statusCode).toBe(200);
    expect(controllerMock.getDocuments).toHaveBeenCalledTimes(1);
    expect(controllerMock.uploadDocuments).not.toHaveBeenCalled();
  });
});
