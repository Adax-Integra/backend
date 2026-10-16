import { afterEach, describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';
import UserModel from '../Data/Models/user.model.js';
import ActivityLogModel from '../Data/Models/activityLog.model.js';

/*
UserModel.deactivate and ActivityLogModel.create are mocked,
so no real account is deactivated and no log entry is saved.
*/

const USER_ID = '0b7a1c1e-6f0a-4b55-9a4e-2f1d7f5c9a10';
const OTHER_USER_ID = '11111111-1111-4111-8111-111111111111';
const DEACTIVATED_AT = '2026-10-15T18:30:00.000';

const tokenFor = (roles, id) =>
  jwt.sign({ user_id: id, roles }, process.env.JWT_SECRET);

const deactivate = (roles, tokenId = USER_ID) =>
  request(app)
    .patch(`/api/profile/${USER_ID}/deactivate`)
    .set('Authorization', `Bearer ${tokenFor(roles, tokenId)}`);

const mockDeactivate = (result) =>
  jest.spyOn(UserModel, 'deactivate').mockResolvedValue(result);

const mockLog = () =>
  jest.spyOn(ActivityLogModel, 'create').mockResolvedValue(undefined);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Unit tests for G-08', () => {
  describe('PATCH /api/profile/:userId/deactivate - deactivate own account', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).patch(
          `/api/profile/${USER_ID}/deactivate`
        );

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to another user', () => {
      it('Should respond with code 403 and not deactivate the account', async () => {
        const spy = mockDeactivate(null);

        const response = await deactivate(['external'], OTHER_USER_ID);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('The token belongs to an admin', () => {
      it('Should respond with code 403', async () => {
        const spy = mockDeactivate(null);

        const response = await deactivate(['admin']);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe(
          'An admin account cannot be deactivated'
        );
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('An external user deactivates her account', () => {
      it('Should respond with code 200 and save the action in the log', async () => {
        mockDeactivate({ user_id: USER_ID, deleted_at: DEACTIVATED_AT });
        const logSpy = mockLog();

        const response = await deactivate(['external']);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toEqual({
          userId: USER_ID,
          deactivatedAt: DEACTIVATED_AT,
        });
        expect(logSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: USER_ID,
            action: 'deactivate_account',
            entity: 'user',
            entityId: USER_ID,
          })
        );
      });
    });

    describe('An internal user deactivates her account', () => {
      it('Should respond with code 200', async () => {
        mockDeactivate({ user_id: USER_ID, deleted_at: DEACTIVATED_AT });
        mockLog();

        const response = await deactivate(['internal']);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.userId).toBe(USER_ID);
      });
    });

    describe('The account is already deactivated', () => {
      it('Should respond with code 409', async () => {
        mockDeactivate(null);

        const response = await deactivate(['external']);

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe(
          'The account is already deactivated or does not exist.'
        );
      });
    });
  });
});
