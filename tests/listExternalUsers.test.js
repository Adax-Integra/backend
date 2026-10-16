import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// The role middleware only reads the roles, so any user id works here
const userId = 'f776c596-e385-4e11-8e1e-554fac5da3f0';

const authHeader = (roles) =>
  `Bearer ${jwt.sign({ user_id: userId, roles }, process.env.JWT_SECRET)}`;

const URL = '/api/internal-users/external-users';

describe('Unit tests for G-16', () => {
  describe('GET /api/internal-users/external-users - list external accounts', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get(URL);

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to an internal user', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .get(URL)
          .set('Authorization', authHeader(['internal']));

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains invalid query parameters', () => {
      it('Should respond with code 400 when page is not a positive integer', async () => {
        const response = await request(app)
          .get(`${URL}?page=0`)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(400);
        expect(response.body.errors.page).toBeDefined();
      });

      it('Should respond with code 400 when status is not allowed', async () => {
        const response = await request(app)
          .get(`${URL}?status=deleted`)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(400);
        expect(response.body.errors.status).toBe(
          'status must be active, inactive or all.'
        );
      });

      it('Should respond with code 400 when sort is not allowed', async () => {
        const response = await request(app)
          .get(`${URL}?sort=email`)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(400);
        expect(response.body.errors.sort).toBe(
          'sort must be recent or alphabetical.'
        );
      });

      it('Should respond with code 400 when search is too long', async () => {
        const response = await request(app)
          .get(`${URL}?search=${'a'.repeat(101)}`)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(400);
        expect(response.body.errors.search).toBeDefined();
      });
    });

    describe('The admin consults the list without filters', () => {
      it('Should respond with code 200 and only active accounts, newest first', async () => {
        const response = await request(app)
          .get(URL)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const { users, page, limit } = response.body.data;
        expect(page).toBe(1);
        expect(limit).toBe(10);
        expect(users.length).toBeLessThanOrEqual(10);

        for (const user of users) {
          expect(user.is_active).toBe(true);
          // Only the list data is returned, no password or personal details
          expect(Object.keys(user).sort()).toEqual([
            'created_at',
            'email',
            'is_active',
            'last_name',
            'name',
            'user_id',
          ]);
        }

        for (let i = 1; i < users.length; i++) {
          const previous = new Date(users[i - 1].created_at);
          const current = new Date(users[i].created_at);
          expect(previous >= current).toBe(true);
        }
      });
    });

    describe('The admin filters by inactive accounts', () => {
      it('Should respond with code 200 and only inactive accounts', async () => {
        const response = await request(app)
          .get(`${URL}?status=inactive`)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(200);
        for (const user of response.body.data.users) {
          expect(user.is_active).toBe(false);
        }
      });
    });

    describe('The admin searches a text with no matches', () => {
      it('Should respond with code 200 and an empty list', async () => {
        const response = await request(app)
          .get(`${URL}?search=zzqx_no_existe&status=all`)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(200);
        expect(response.body.data.users).toEqual([]);
        expect(response.body.data.total).toBe(0);
      });
    });

    describe('The admin asks for a page after the last one', () => {
      it('Should respond with code 200 and an empty page', async () => {
        const response = await request(app)
          .get(`${URL}?page=100000`)
          .set('Authorization', authHeader(['admin']));

        expect(response.statusCode).toBe(200);
        expect(response.body.data.users).toEqual([]);
      });
    });
  });
});
