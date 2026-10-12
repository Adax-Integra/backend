import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';
import EmailCodeModel from '../Data/Models/emailCode.model.js';
import ExternalUserModel from '../Data/Models/externalUser.model.js';
import RoleModel from '../Data/Models/role.model.js';
import UserModel from '../Data/Models/user.model.js';
import MailerService from '../Data/Services/mailer.service.js';
import EmailCodeService, {
  EMAIL_CODE_PURPOSE,
} from '../Domain/Services/emailCode.service.js';

const userId = '7b1d2c4e-1f3a-4b5c-8d9e-0a1b2c3d4e5f';
const email = 'usuaria@example.com';
const password = 'password123';
const { VERIFY_EMAIL } = EMAIL_CODE_PURPOSE;

// In-memory replacement for the email_code table, so the tests exercise the
// real service logic without a database
let codeTable;
// Codes "emailed" by MailerService, in the order they were sent
let sentCodes;

beforeEach(() => {
  codeTable = new Map();
  sentCodes = [];

  const key = (id, purpose) => `${id}:${purpose}`;

  jest
    .spyOn(EmailCodeModel, 'find')
    .mockImplementation(
      async (id, purpose) => codeTable.get(key(id, purpose)) ?? null
    );
  jest
    .spyOn(EmailCodeModel, 'upsert')
    .mockImplementation(
      async ({ userId: id, purpose, codeHash, expiresAt, sendCount }) => {
        codeTable.set(key(id, purpose), {
          user_id: id,
          purpose,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
          send_count: sendCount,
          last_sent_at: new Date().toISOString(),
        });
      }
    );
  jest
    .spyOn(EmailCodeModel, 'setAttempts')
    .mockImplementation(async (id, purpose, attempts) => {
      codeTable.get(key(id, purpose)).attempts = attempts;
    });
  jest
    .spyOn(EmailCodeModel, 'remove')
    .mockImplementation(async (id, purpose) => {
      codeTable.delete(key(id, purpose));
    });

  jest
    .spyOn(MailerService, 'sendEmailCode')
    .mockImplementation(async (_to, code) => {
      sentCodes.push(code);
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Moves the stored code back in time, as if minutes had passed
function ageStoredCode({ sentMsAgo = 0, expiresInMs }) {
  const row = codeTable.get(`${userId}:${VERIFY_EMAIL}`);
  row.last_sent_at = new Date(Date.now() - sentMsAgo).toISOString();
  if (expiresInMs !== undefined) {
    row.expires_at = new Date(Date.now() + expiresInMs).toISOString();
  }
}

// Expects a promise to reject with the given HTTP status and error code
async function expectError(promise, status, code) {
  await expect(promise).rejects.toMatchObject({ status, code });
}

// Unit tests: rules for issuing and consuming codes (no HTTP, so they do not
// count against the rate limiters)
describe('EmailCodeService', () => {
  it('emails a 6 digit code and stores only its hash', async () => {
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });

    expect(sentCodes).toHaveLength(1);
    expect(sentCodes[0]).toMatch(/^\d{6}$/);

    const row = codeTable.get(`${userId}:${VERIFY_EMAIL}`);
    expect(row.code_hash).not.toContain(sentCodes[0]);
    expect(row.send_count).toBe(1);
  });

  it('accepts the right code once and then deletes it', async () => {
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });
    const code = sentCodes[0];

    await EmailCodeService.consumeCode({ userId, purpose: VERIFY_EMAIL, code });

    expect(codeTable.size).toBe(0);
    await expectError(
      EmailCodeService.consumeCode({ userId, purpose: VERIFY_EMAIL, code }),
      400,
      'CODE_INVALID'
    );
  });

  it('counts a wrong code as a failed attempt', async () => {
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });
    const wrongCode = sentCodes[0] === '000000' ? '111111' : '000000';

    await expectError(
      EmailCodeService.consumeCode({
        userId,
        purpose: VERIFY_EMAIL,
        code: wrongCode,
      }),
      400,
      'CODE_INVALID'
    );

    expect(codeTable.get(`${userId}:${VERIFY_EMAIL}`).attempts).toBe(1);
  });

  it('rejects an expired code', async () => {
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });
    ageStoredCode({ expiresInMs: -1000 });

    await expectError(
      EmailCodeService.consumeCode({
        userId,
        purpose: VERIFY_EMAIL,
        code: sentCodes[0],
      }),
      400,
      'CODE_EXPIRED'
    );
  });

  it('blocks the code after 5 failed attempts, even if the next one is right', async () => {
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });
    codeTable.get(`${userId}:${VERIFY_EMAIL}`).attempts = 5;

    await expectError(
      EmailCodeService.consumeCode({
        userId,
        purpose: VERIFY_EMAIL,
        code: sentCodes[0],
      }),
      429,
      'TOO_MANY_ATTEMPTS'
    );
  });

  it('asks to wait 60 seconds between emails', async () => {
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });

    await expectError(
      EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL }),
      429,
      'RESEND_TOO_SOON'
    );
    expect(sentCodes).toHaveLength(1);
  });

  it('allows at most 3 emails while the code is still valid', async () => {
    for (let i = 0; i < 3; i += 1) {
      await EmailCodeService.issueCode({
        userId,
        email,
        purpose: VERIFY_EMAIL,
      });
      ageStoredCode({ sentMsAgo: 61 * 1000 });
    }

    await expectError(
      EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL }),
      429,
      'TOO_MANY_SENDS'
    );
    expect(sentCodes).toHaveLength(3);
  });

  it('starts counting again once the previous code expired', async () => {
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });
    codeTable.get(`${userId}:${VERIFY_EMAIL}`).send_count = 3;
    ageStoredCode({ sentMsAgo: 16 * 60 * 1000, expiresInMs: -1000 });

    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });

    expect(codeTable.get(`${userId}:${VERIFY_EMAIL}`).send_count).toBe(1);
  });
});

// HTTP tests: each request counts against the rate limiters
// (register: 5 per 30 min, auth: 10 per 15 min), so keep them few
describe('POST /api/external-user/register (G-01)', () => {
  const body = {
    name: 'María',
    last_name: 'Gómez',
    phone: '4421234567',
    email,
    password,
    confirm_password: password,
  };

  it('creates the account and emails a verification code', async () => {
    jest.spyOn(ExternalUserModel, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(RoleModel, 'findIdByDescription').mockResolvedValue('role-id');
    jest.spyOn(ExternalUserModel, 'createAccount').mockResolvedValue({
      user: {
        user_id: userId,
        name: body.name,
        last_name: body.last_name,
        email,
        phone: body.phone,
      },
      record_id: 'record-id',
      address_id: 'address-id',
      document_id: 'document-id',
    });

    const response = await request(app)
      .post('/api/external-user/register')
      .send(body);

    expect(response.statusCode).toBe(201);
    expect(response.body.data.userId).toBe(userId);
    expect(sentCodes).toHaveLength(1);
    expect(sentCodes[0]).toMatch(/^\d{6}$/);
  });

  it('answers 409 EMAIL_TAKEN for a registered email', async () => {
    jest
      .spyOn(ExternalUserModel, 'findByEmail')
      .mockResolvedValue({ user_id: userId });
    const createAccount = jest.spyOn(ExternalUserModel, 'createAccount');

    const response = await request(app)
      .post('/api/external-user/register')
      .send(body);

    expect(response.statusCode).toBe(409);
    expect(response.body.code).toBe('EMAIL_TAKEN');
    expect(createAccount).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/verify-email (G-09)', () => {
  it('verifies the account and returns a session token', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue({
      user_id: userId,
      email,
      email_verified_at: null,
    });
    const markEmailVerified = jest
      .spyOn(UserModel, 'markEmailVerified')
      .mockResolvedValue();
    jest.spyOn(RoleModel, 'findRolesByUserId').mockResolvedValue(['external']);
    await EmailCodeService.issueCode({ userId, email, purpose: VERIFY_EMAIL });

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ email, code: sentCodes[0] });

    expect(response.statusCode).toBe(200);
    expect(markEmailVerified).toHaveBeenCalledWith(userId);
    expect(response.body.data).toMatchObject({
      user_id: userId,
      roles: ['external'],
    });
    // authMiddleware reads user_id from the token payload
    const payload = jwt.verify(
      response.body.data.token,
      process.env.JWT_SECRET
    );
    expect(payload.user_id).toBe(userId);
  });

  it('does not log in an account that is already verified', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue({
      user_id: userId,
      email,
      email_verified_at: '2026-10-01T00:00:00',
    });

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ email, code: '123456' });

    expect(response.statusCode).toBe(409);
    expect(response.body.code).toBe('ALREADY_VERIFIED');
    expect(response.body.data).toBeUndefined();
  });

  it('answers like a wrong code when the email does not exist', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'nadie@example.com', code: '123456' });

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe('CODE_INVALID');
  });
});

describe('POST /api/auth/resend-verification (G-09)', () => {
  it('gives the same answer for an unknown email and sends nothing', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'nadie@example.com' });

    expect(response.statusCode).toBe(200);
    expect(sentCodes).toHaveLength(0);
  });

  it('sends a new code to an unverified account', async () => {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue({
      user_id: userId,
      email,
      email_verified_at: null,
    });

    const response = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email });

    expect(response.statusCode).toBe(200);
    expect(sentCodes).toHaveLength(1);
  });
});

describe('POST /api/auth/login (G-02)', () => {
  async function mockUser(emailVerifiedAt) {
    jest.spyOn(UserModel, 'findByEmail').mockResolvedValue({
      user_id: userId,
      email,
      password: await bcrypt.hash(password, 10),
      email_verified_at: emailVerifiedAt,
    });
    jest.spyOn(RoleModel, 'findRolesByUserId').mockResolvedValue(['external']);
  }

  it('rejects a correct password when the email is not verified', async () => {
    await mockUser(null);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.statusCode).toBe(403);
    expect(response.body.code).toBe('EMAIL_NOT_VERIFIED');
    expect(response.body.data).toBeUndefined();
  });

  it('logs in a verified account', async () => {
    await mockUser('2026-10-01T00:00:00');

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.user_id).toBe(userId);
    expect(typeof response.body.data.token).toBe('string');
  });
});
