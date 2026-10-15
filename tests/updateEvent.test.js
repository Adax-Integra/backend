import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { supabase } from '../Data/Config/supabase.js';

// The role middleware only reads the roles, so any user id works here
const userId = 'f776c596-e385-4e11-8e1e-554fac5da3f0';

const userToken = (roles) =>
  jwt.sign({ user_id: userId, roles }, process.env.JWT_SECRET);

const authHeader = (roles) => `Bearer ${userToken(roles)}`;

const editedEvent = {
  title: 'Prueba E-02 editada',
  startsAt: '2026-11-03T10:00:00-06:00',
  endsAt: '2026-11-03T12:00:00-06:00',
  modality: 'Virtual',
  link: 'https://meet.google.com/abc',
  description: 'Descripción editada',
};

// No event uses this id, so editing it finds nothing
const missingEventId = '2b1f7c3e-8d4a-4f6b-9c2d-1e3f5a7b9c0d';

let eventId;
let disabledEventId;

beforeAll(async () => {
  const { data } = await supabase
    .from('event')
    .insert([
      {
        title: 'Prueba E-02',
        starts_at: '2026-11-03T16:00:00Z',
        ends_at: '2026-11-03T17:30:00Z',
        modality: 'Presencial',
        location: 'Oficinas ADAX',
        description: 'Evento de prueba del endpoint',
      },
      {
        title: 'Prueba E-02 deshabilitado',
        starts_at: '2026-11-03T16:00:00Z',
        ends_at: '2026-11-03T17:30:00Z',
        modality: 'Presencial',
        location: 'Oficinas ADAX',
        description: 'Evento de prueba ya deshabilitado',
        deleted_at: new Date().toISOString(),
      },
    ])
    .select('event_id, title');

  eventId = data.find((event) => event.title === 'Prueba E-02').event_id;
  disabledEventId = data.find(
    (event) => event.title === 'Prueba E-02 deshabilitado'
  ).event_id;
});

// The tests write to the shared table, so every event they create is removed at the end
afterAll(async () => {
  await supabase
    .from('event')
    .delete()
    .in('event_id', [eventId, disabledEventId]);
});

describe('Unit tests for E-02', () => {
  describe('PUT /api/events/:eventId - update an event', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .put(`/api/events/${eventId}`)
          .send(editedEvent);

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to an external user', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .put(`/api/events/${eventId}`)
          .set('Authorization', authHeader(['external']))
          .send(editedEvent);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains an invalid event id', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .put('/api/events/abc')
          .set('Authorization', authHeader(['internal']))
          .send(editedEvent);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('eventId must be a valid UUID');
      });
    });

    describe('It contains an end date before the start date', () => {
      it('Should respond with code 400 and the error of the field', async () => {
        const response = await request(app)
          .put(`/api/events/${eventId}`)
          .set('Authorization', authHeader(['internal']))
          .send({
            ...editedEvent,
            startsAt: '2026-11-03T12:00:00-06:00',
            endsAt: '2026-11-03T10:00:00-06:00',
          });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual({
          endsAt: 'endsAt must be after startsAt',
        });
      });
    });

    describe('It contains an event that does not exist', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .put(`/api/events/${missingEventId}`)
          .set('Authorization', authHeader(['internal']))
          .send(editedEvent);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(
          'The event does not exist or is disabled.'
        );
      });
    });

    describe('It contains an event that is disabled', () => {
      it('Should respond with code 404', async () => {
        const response = await request(app)
          .put(`/api/events/${disabledEventId}`)
          .set('Authorization', authHeader(['internal']))
          .send(editedEvent);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(
          'The event does not exist or is disabled.'
        );
      });
    });

    describe('It contains an active event and a valid body', () => {
      it('Should respond with code 200 and the updated event', async () => {
        const response = await request(app)
          .put(`/api/events/${eventId}`)
          .set('Authorization', authHeader(['admin']))
          .send(editedEvent);

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toEqual({
          eventId,
          title: 'Prueba E-02 editada',
          startsAt: expect.any(String),
          endsAt: expect.any(String),
          modality: 'Virtual',
          // Changing to Virtual clears the old address
          location: null,
          link: 'https://meet.google.com/abc',
          phone: null,
          description: 'Descripción editada',
          notes: null,
        });
        expect(new Date(response.body.data.endsAt).toISOString()).toBe(
          '2026-11-03T18:00:00.000Z'
        );
      });
    });
  });
});
