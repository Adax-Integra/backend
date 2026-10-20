import app from '../Source/app.js';
import request from 'supertest';

// G-02: Test for the login attempt limit.
// Each IP can try to log in 10 times every 15 minutes.
// Jest starts with a fresh limit for this test file.
// The requests are empty, so they return 400 without checking the database.

describe('Unit tests for G-02 rate limiting', () => {
  describe('POST /api/auth/login - limit of 10 attempts every 15 minutes', () => {
    describe('It contains the first 10 attempts', () => {
      it('Should respond with code 400 every time', async () => {
        for (let i = 0; i < 10; i++) {
          const response = await request(app).post('/api/auth/login').send({});

          expect(response.statusCode).toBe(400);
        }
      });
    });

    describe('It contains the attempt number 11', () => {
      it('Should respond with code 429', async () => {
        const response = await request(app).post('/api/auth/login').send({});

        expect(response.statusCode).toBe(429);
        expect(response.body.error).toBe(
          'Too many login attemps, try again later'
        );
        // 10 attempts in 900 seconds (15 minutes)
        expect(response.headers['ratelimit-policy']).toBe('10;w=900');
      });
    });
  });
});
