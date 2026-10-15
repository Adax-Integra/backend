import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { supabase } from '../Data/Config/supabase.js';

// The role middleware only reads the roles, so any user id works here
const userId = 'f776c596-e385-4e11-8e1e-554fac5da3f0';

const userToken = (roles) =>
  jwt.sign({ user_id: userId, roles }, process.env.JWT_SECRET);

const authHeader = (roles) => `Bearer ${userToken(roles)}`;

let eventId;

beforeAll(async () => {
  const { data } = await supabase
    .from('event')
    .insert({
      title: 'Prueba E-03',
      starts_at: '2026-11-03T16:00:00Z',
      ends_at: '2026-11-03T17:30:00Z',
      modality: 'Presencial',
      location: 'Oficinas ADAX',
      description: 'Evento de prueba del endpoint',
    })
    .select('event_id')
    .single();

  eventId = data.event_id;
});

afterAll(async () => {
  await supabase.from('event').delete().eq('event_id', eventId);
});

describe('Unit tests for E-03', () => {
  describe('PATCH /api/events/:eventId/disable - disable an event', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).patch(
          `/api/events/${eventId}/disable`
        );

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to an external user', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .patch(`/api/events/${eventId}/disable`)
          .set('Authorization', authHeader(['external']));

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains an invalid event id', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .patch('/api/events/abc/disable')
          .set('Authorization', authHeader(['internal']));

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('eventId must be a valid UUID');
      });
    });

    describe('It contains an active event', () => {
      it('Should respond with code 200 and the disabled event', async () => {
        const response = await request(app)
          .patch(`/api/events/${eventId}/disable`)
          .set('Authorization', authHeader(['internal']));

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toEqual({
          eventId,
          disabledAt: expect.any(String),
        });
      });
    });

    describe('It contains an event that is already disabled', () => {
      it('Should respond with code 409', async () => {
        const response = await request(app)
          .patch(`/api/events/${eventId}/disable`)
          .set('Authorization', authHeader(['internal']));

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe(
          'The event is already disabled or does not exist.'
        );
      });
    });
  });
});
