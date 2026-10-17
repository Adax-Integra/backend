import app from '../Source/app.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { supabase } from '../Data/Config/supabase.js';

// Password shared by every test account
const password = 'Prueba123!';
// Each email includes the current time to avoid conflicts with other accounts
const verifiedEmail = `g02-verified-${Date.now()}@test.invalid`;
const unverifiedEmail = `g02-unverified-${Date.now()}@test.invalid`;
const inactiveEmail = `g02-inactive-${Date.now()}@test.invalid`;

let verifiedUserId;
let unverifiedUserId;
let inactiveUserId;

// Creates the accounts used only by these tests
beforeAll(async () => {
  const hash = await bcrypt.hash(password, 10);

  const { data } = await supabase
    .from('user')
    .insert([
      {
        name: 'Prueba',
        last_name: 'G-02',
        email: verifiedEmail,
        password: hash,
        email_verified_at: new Date().toISOString(),
      },
      {
        name: 'Prueba',
        last_name: 'G-02 sin verificar',
        email: unverifiedEmail,
        password: hash,
        email_verified_at: null,
      },
      {
        name: 'Prueba',
        last_name: 'G-02 desactivada',
        email: inactiveEmail,
        password: hash,
        email_verified_at: new Date().toISOString(),
        deleted_at: new Date().toISOString(),
      },
    ])
    .select('user_id, email');

  verifiedUserId = data.find((user) => user.email === verifiedEmail).user_id;
  unverifiedUserId = data.find(
    (user) => user.email === unverifiedEmail
  ).user_id;
  inactiveUserId = data.find((user) => user.email === inactiveEmail).user_id;

  // The verified account gets the external role
  const { data: role } = await supabase
    .from('role')
    .select('role_id')
    .eq('description', 'external')
    .single();

  await supabase
    .from('user_role')
    .insert({ user_id: verifiedUserId, role_id: role.role_id });
});

// The tests write to the shared tables, so every account is removed at the end
afterAll(async () => {
  const userIds = [verifiedUserId, unverifiedUserId, inactiveUserId];

  await supabase.from('user_role').delete().in('user_id', userIds);
  await supabase.from('user').delete().in('user_id', userIds);
});

describe('Unit tests for G-02', () => {
  describe('POST /api/auth/login - log in to the system', () => {
    describe('It contains no email and no password', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app).post('/api/auth/login').send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Email and password are required.');
      });
    });

    describe('It contains an empty email', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: '', password });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Email and password are required.');
      });
    });

    describe('It contains an empty password', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: verifiedEmail, password: '' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Email and password are required.');
      });
    });

    describe('It contains an email that is not registered', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'g02-nobody@test.invalid', password });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid email or password.');
      });
    });

    describe('It contains a wrong password', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: verifiedEmail, password: 'WrongPassword1!' });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid email or password.');
      });
    });

    describe('It contains an account that is deactivated', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: inactiveEmail, password });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid email or password.');
      });
    });

    describe('It contains an account with the email not verified', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: unverifiedEmail, password });

        expect(response.statusCode).toBe(403);
        expect(response.body.code).toBe('EMAIL_NOT_VERIFIED');
        expect(response.body.error).toBe('Email not verified.');
      });
    });

    describe('It contains a valid email and password', () => {
      it('Should respond with code 200, the token and the roles', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: verifiedEmail, password });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.user_id).toBe(verifiedUserId);
        expect(response.body.data.roles).toEqual(['external']);

        // The token must be valid and carry the same user and roles
        const tokenData = jwt.verify(
          response.body.data.token,
          process.env.JWT_SECRET
        );
        expect(tokenData.user_id).toBe(verifiedUserId);
        expect(tokenData.roles).toEqual(['external']);
      });
    });

    describe('It contains the email with uppercase letters and spaces', () => {
      it('Should respond with code 200', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: `  ${verifiedEmail.toUpperCase()}  `, password });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.user_id).toBe(verifiedUserId);
      });
    });
  });
});
