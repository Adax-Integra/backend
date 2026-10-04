import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// User A is an existing external user and is tested in the successful response tests
const userA = 'f5e392c4-2c3d-4c50-9e9f-3d4ac269f2c5';

// User B is another existing user, used to test access to someone else's data
const userB = 'cae4ccf1-4a45-406e-bcfc-6a475ad63fa4';

// User C does not exist and is tested in the nonexistent user tests
const userC = '11111111-1111-4111-8111-111111111111';

// Pre-submission is only for the owner, so every token belongs to an external user
const externalToken = (userId) =>
  jwt.sign({ user_id: userId, roles: ['external'] }, process.env.JWT_SECRET);

const internalToken = jwt.sign(
  { user_id: 'test-internal-user', roles: ['internal'] },
  process.env.JWT_SECRET
);

const authHeader = (userId = userA) =>
  ['Bearer', externalToken(userId)].join(' ');

// Signed URLs change on every request, so only their shape is checked
const expectedDocuments = expect.objectContaining({
  document_id: expect.any(String),
});

/*
Unit testing for all user stories related to the pre-submission
Each User Story should have its own 'describe' block, inside it, there should
be different 'describe' blocks
*/

describe('Unit tests for R-01', () => {
  describe('GET /api/external-users/{userId}/pre-submission - get the pre-submission data from a user', () => {
    describe('It contains an empty userId', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .get('/api/external-users//pre-submission')
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(404);
      });
    });

    describe('Contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/external-users/1222155/pre-submission')
          .set('Authorization', authHeader('1222155'));

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get(
          `/api/external-users/${userA}/pre-submission`
        );

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('It contains an invalid authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .get(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', 'Bearer invalid-token');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('It contains a token for an external user that does not own the data', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader(userB));

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains a token for an internal user', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains a valid userId and the owner token', () => {
      it('Should respond with code 200 and the pre-submission data', async () => {
        const response = await request(app)
          .get(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: {
            user_id: userA,
            profile: expect.objectContaining({
              name: expect.any(String),
              last_name: expect.any(String),
            }),
            address: expect.anything(),
            documents: expect.anything(),
          },
        });
      });
    });

    describe('It contains a valid userId that does not exist', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get(`/api/external-users/${userC}/pre-submission`)
          .set('Authorization', authHeader(userC));

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
          success: false,
          error: 'User profile not found.',
        });
      });
    });
  });

  describe('PUT /api/external-users/{userId}/pre-submission - update the pre-submission data from a user', () => {
    describe('It contains an empty userId', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .put('/api/external-users//pre-submission')
          .set('Authorization', authHeader())
          .send({ profile: { name: 'Ana Valeria' } })
          .send({ address: { address_line_1: 'Camellón del León' } });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('Contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put('/api/external-users/1222155/pre-submission')
          .set('Authorization', authHeader('1222155'))
          .send({ profile: { name: 'Sara' } });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('It contains an empty body', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
          'At least one profile, address, or documents field is required.'
        );
      });
    });

    describe('It contains a profile that is not an object', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({ profile: ['Ana'] });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('profile must be an object.');
      });
    });

    describe('It contains a profile that is not valid JSON in a multipart request', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .field('profile', '{name: Ana');

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('profile must be valid JSON.');
      });
    });

    describe('It contains an invalid phone', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({ profile: { phone: '12345' } });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('phone must be a valid phone number.');
      });
    });

    describe('It contains an invalid birth date', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({ profile: { birth_date: '01/01/2000' } });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('date must be in YYYY-MM-DD format.');
      });
    });

    describe('It contains an empty required address field', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({ address: { city: '   ' } });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
          'address.city must be a non-empty string.'
        );
      });
    });

    describe('It contains a document path from another user', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({
            documents: { identity_document: `${userB}/identity/file.pdf` },
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
          `documents.identity_document path must start with "${userA}/".`
        );
      });
    });

    describe('It contains a document path with invalid segments', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({
            documents: {
              proof_of_address: `${userA}/../${userB}/address/file.pdf`,
            },
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
          'documents.proof_of_address contains an invalid path.'
        );
      });
    });

    describe('It contains a document path that does not exist in storage', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({
            documents: {
              identity_document: `${userA}/identity/does-not-exist.pdf`,
            },
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
          'documents.identity_document: file not found in storage.'
        );
      });
    });

    describe('It contains a file with a type that is not allowed', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .attach('identity_document', Buffer.from('plain text'), {
            filename: 'identity.txt',
            contentType: 'text/plain',
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
          'identity_document: only PDF, JPEG or PNG allowed.'
        );
      });
    });

    describe('It contains a file bigger than 5 MB', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .attach('proof_of_address', Buffer.alloc(5 * 1024 * 1024 + 1), {
            filename: 'address.pdf',
            contentType: 'application/pdf',
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('File exceeds the 5 MB limit.');
      });
    });

    describe('It contains a valid userId that does not exist', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put(`/api/external-users/${userC}/pre-submission`)
          .set('Authorization', authHeader(userC))
          .send({ profile: { name: 'Ana' } });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    /*
    The successful update request sends back the values the user already has,
    so running the tests does not change the data in supabase.
    */
    describe('It contains a valid body and the owner token', () => {
      it('Should respond with code 200 and the updated pre-submission data', async () => {
        const current = await request(app)
          .get(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader());
        const { profile, address } = current.body.data;

        const response = await request(app)
          .put(`/api/external-users/${userA}/pre-submission`)
          .set('Authorization', authHeader())
          .send({
            profile: { name: profile.name, last_name: profile.last_name },
            address: { city: address.city },
          });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: {
            user_id: userA,
            profile,
            address,
            documents: expectedDocuments,
          },
        });
      });
    });
  });
});
