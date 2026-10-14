import { describe, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';

/*
R-02 integration test for createCaseLimiter (10 requests per IP per hour).
Jest gives every test file its own module registry, so this file starts
with a fresh limiter. The requests use an invalid body, so they answer 400
before reaching the database.
*/

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '987e6543-e21b-42d3-a456-426614174000';
const LIMIT = 10;

const tokenFor = (id) =>
  jwt.sign({ user_id: id, roles: ['external'] }, process.env.JWT_SECRET);

const postInvalid = (id) =>
  request(app)
    .post(`/api/external-users/${id}/cases`)
    .set('Authorization', `Bearer ${tokenFor(id)}`)
    .send({});

describe('Integration tests for R-02 rate limiting', () => {
  it('RL-01 requests rejected by authMiddleware do not use the limit', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .post(`/api/external-users/${USER_ID}/cases`)
        .send({});
      expect(response.statusCode).toBe(401);
    }
  });

  it('RL-02 blocks the request after the limit with 429', async () => {
    for (let i = 0; i < LIMIT; i++) {
      const response = await postInvalid(USER_ID);
      expect(response.statusCode).toBe(400);
    }

    const blocked = await postInvalid(USER_ID);

    expect(blocked.statusCode).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      error: 'Too many cases created, try again later.',
    });
  });

  it('RL-03 the limit is shared by every user on the same IP', async () => {
    const response = await postInvalid(OTHER_USER_ID);

    expect(response.statusCode).toBe(429);
  });
});
