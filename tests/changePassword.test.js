import { afterEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../Source/app.js';
import UserModel from '../Data/Models/user.model.js';

process.env.JWT_SECRET ||= 'test-jwt-secret';

const userId = 'f5e392c4-2c3d-4c50-9e9f-3d4ac269f2c5';
const currentPassword = 'currentPassword123';
const newPassword = 'newPassword123';
const authToken = jwt.sign(
  { user_id: userId, roles: ['external'] },
  process.env.JWT_SECRET
);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /api/auth/change-password', () => {
  it('updates the password hash for the authenticated user', async () => {
    const currentPasswordHash = await bcrypt.hash(currentPassword, 10);
    jest
      .spyOn(UserModel, 'findById')
      .mockResolvedValue({ user_id: userId, password: currentPasswordHash });
    const updatePassword = jest
      .spyOn(UserModel, 'updatePassword')
      .mockResolvedValue({ user_id: userId });

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { message: 'Password updated successfully.' },
    });
    expect(updatePassword).toHaveBeenCalledWith(userId, expect.any(String));
    const newPasswordHash = updatePassword.mock.calls[0][1];
    expect(await bcrypt.compare(newPassword, newPasswordHash)).toBe(true);
    expect(await bcrypt.compare(currentPassword, newPasswordHash)).toBe(false);
    expect(JSON.stringify(response.body)).not.toContain(currentPassword);
    expect(JSON.stringify(response.body)).not.toContain(newPassword);
  });

  it('rejects an incorrect current password without updating the hash', async () => {
    jest.spyOn(UserModel, 'findById').mockResolvedValue({
      user_id: userId,
      password: await bcrypt.hash(currentPassword, 10),
    });
    const updatePassword = jest.spyOn(UserModel, 'updatePassword');

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        current_password: 'incorrectPassword',
        new_password: newPassword,
        confirm_password: newPassword,
      });

    expect(response.statusCode).toBe(401);
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('rejects invalid new password data', async () => {
    const findById = jest.spyOn(UserModel, 'findById');

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        current_password: currentPassword,
        new_password: 'short',
        confirm_password: 'different',
      });

    expect(response.statusCode).toBe(400);
    expect(findById).not.toHaveBeenCalled();
  });

  it('requires a valid authorization token', async () => {
    const response = await request(app).post('/api/auth/change-password').send({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword,
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Token is required.');
  });
});
