import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const testToken = jwt.sign(
  {
    user_id: 'test-internal-user',
    roles: ['internal'],
  },
  process.env.JWT_SECRET
);

// User A has 2 cases and is tested in the successful response test
const userA = 'f5e392c4-2c3d-4c50-9e9f-3d4ac269f2c5';

// User B has no cases and is tested in the empty response test
const userB = 'cae4ccf1-4a45-406e-bcfc-6a475ad63fa4';

// User C does not exist and is tested in the nonexistent user test
const userC = '11111111-1111-4111-8111-111111111111';

const authHeader = () => ['Bearer', testToken].join(' ');

/*
Unit testing for all user stories related to cases
Each User Story should have its own 'describe' block, inside it, there should
be different 'describe' blocks
*/

describe('Unit tests for V-10', () => {
  describe('GET /api/internal-users/{userId}/allCases - get all the cases from a user', () => {
    describe('It contains an empty userId', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .get('/api/internal-users//allCases')
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(404);
      });
    });

    describe('Contains an invalid userId', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/internal-users/1222155/allCases')
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(400);
      });
    });

    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get(
          `/api/internal-users/${userA}/allCases`
        );

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('It contains an invalid authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userA}/allCases`)
          .set('Authorization', 'Bearer invalid-token');

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('It contains a token for a user without an allowed role', () => {
      it('Should respond with code 403', async () => {
        const externalToken = jwt.sign(
          { user_id: 'test-external-user', roles: ['external'] },
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .get(`/api/internal-users/${userA}/allCases`)
          .set('Authorization', `Bearer ${externalToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains a valid userId with cases', () => {
      it('Should respond with code 200 and the user cases', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userA}/allCases`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: [
            {
              caseId: '0c773060-06f9-4506-a2e0-230e99f40550',
              writtenDescription:
                'Abuso de confianza, control financiero absoluto por parte del cónyuge y violencia verbal.',
              writtenHelpsWanted:
                'Acompañamiento en la presentación de denuncia formal y juicio de divorcio.',
              hasLawyer: true,
              state: 'Closed',
              createdAt: '2026-09-30T06:45:51.087Z',
              updatedAt: '2026-09-30T06:45:51.087Z',
              helps: [
                'Acompañamiento jurídico.\n',
                'Acompañamiento ante instituciones.\n',
              ],
              violenceTypes: ['Económica', 'Psicológica'],
            },
            {
              caseId: '2b8882aa-1247-4cc7-abaa-f52488131726',
              writtenDescription:
                'Manifiesta haber sufrido agresiones físicas recientes y coacción en su domicilio familiar.',
              writtenHelpsWanted:
                'Requiere atención inmediata a víctimas de violencia y orientación jurídica sobre orden de alejamiento.',
              hasLawyer: true,
              state: 'Open',
              createdAt: '2026-09-30T06:45:51.087Z',
              updatedAt: '2026-09-30T09:13:35.038Z',
              helps: [
                'Atención a mujeres en situación de violencia.\n',
                'Acompañamiento jurídico.\n',
              ],
              violenceTypes: ['Física', 'Psicológica'],
            },
          ],
        });
      });
    });

    describe('It contains a valid userId that does not exist', () => {
      it('Should respond with code 200 and an empty data array', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userC}/allCases`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: [],
        });
      });
    });

    describe('It contains a valid userId without cases', () => {
      it('Should respond with code 200 and an empty data array', async () => {
        const response = await request(app)
          .get(`/api/internal-users/${userB}/allCases`)
          .set('Authorization', authHeader());

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: [],
        });
      });
    });
  });
});
