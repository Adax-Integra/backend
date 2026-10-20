import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// User A already accepted the notice in force and is tested in the accepted tests
const userA = 'f776c596-e385-4e11-8e1e-554fac5da3f0';
const userAConsent = {
  consentId: 'a031eb5d-562b-4506-a8be-03525ecaf8a4',
  acceptedAt: '2026-10-08T14:29:50.658186',
};

// User B has not accepted the notice and no test should make it accept
const userB = 'ad91b33a-7de4-493b-8af9-dbaffe0b8d1f';

// User C accepts the notice in the POST test, so it only starts without consent on the first run
const userC = '0105db2f-7e34-4602-8a22-14c09e1ffa45';

// Notice in force in Supabase, these values change if a new version is uploaded
const policyId = 'e23378ff-2917-4ff3-81f0-961d0d934ad0';
const version = '1.1.0';
const documentPath = 'version-1.1.0/Aviso_Adax_Digitales.pdf';

const nonexistentPolicyId = '11111111-1111-4111-8111-111111111111';

const externalToken = (userId) =>
  jwt.sign({ user_id: userId, roles: ['external'] }, process.env.JWT_SECRET);

const authHeader = (userId) => `Bearer ${externalToken(userId)}`;

describe('Unit tests for V-02', () => {
  describe('GET /api/privacy-policy/current - get the privacy notice in force', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 200 and only the public fields', async () => {
        const response = await request(app).get('/api/privacy-policy/current');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: {
            policyId,
            version,
            documentUrl: expect.stringContaining(documentPath),
          },
        });
      });
    });
  });

  describe('GET /api/privacy-policy/consent - check if the user accepted the notice in force', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get('/api/privacy-policy/consent');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The user has not accepted the notice in force', () => {
      it('Should respond with code 200 and hasAccepted false', async () => {
        const response = await request(app)
          .get('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userB));

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: { hasAccepted: false, policyId, version, acceptedAt: null },
        });
      });
    });

    describe('The user already accepted the notice in force', () => {
      it('Should respond with code 200 and hasAccepted true', async () => {
        const response = await request(app)
          .get('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userA));

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toEqual({
          hasAccepted: true,
          policyId,
          version,
          acceptedAt: userAConsent.acceptedAt,
        });
      });
    });

    describe('It contains the userId of another user in the query', () => {
      it('Should respond with code 200 using the userId from the token', async () => {
        const response = await request(app)
          .get(`/api/privacy-policy/consent?userId=${userA}`)
          .set('Authorization', authHeader(userB));

        expect(response.statusCode).toBe(200);
        expect(response.body.data.hasAccepted).toBe(false);
      });
    });
  });

  describe('POST /api/privacy-policy/consent - register the consent of the user', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .post('/api/privacy-policy/consent')
          .send({ policyId });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('It contains an invalid policyId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .post('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userB))
          .send({ policyId: '1222155' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('policyId must be a valid UUID');
      });
    });

    describe('It contains a valid policyId that does not exist', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .post('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userB))
          .send({ policyId: nonexistentPolicyId });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('The privacy policy was not found.');
      });
    });

    describe('It contains a valid policyId plus userId, version and ipAddress', () => {
      it('Should respond with code 201 and save the consent only for the token user', async () => {
        const response = await request(app)
          .post('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userC))
          .send({
            policyId,
            userId: userB,
            version: '9.9.9',
            ipAddress: '1.2.3.4',
          });

        expect(response.statusCode).toBe(201);
        expect(response.body.data).toEqual({
          consentId: expect.any(String),
          version,
          acceptedAt: expect.any(String),
        });

        const tokenUser = await request(app)
          .get('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userC));
        const bodyUser = await request(app)
          .get('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userB));

        expect(tokenUser.body.data.hasAccepted).toBe(true);
        expect(bodyUser.body.data.hasAccepted).toBe(false);
      });
    });

    describe('The user already accepted the notice', () => {
      it('Should respond with code 201 and the existing consent', async () => {
        const response = await request(app)
          .post('/api/privacy-policy/consent')
          .set('Authorization', authHeader(userA))
          .send({ policyId });

        expect(response.statusCode).toBe(201);
        expect(response.body.data).toEqual({
          consentId: userAConsent.consentId,
          version,
          acceptedAt: userAConsent.acceptedAt,
        });
      });
    });
  });
});
