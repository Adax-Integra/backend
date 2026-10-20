import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { supabase } from '../Data/Config/supabase.js';

// The role middleware only reads the roles, so any user id works here
const userId = 'f776c596-e385-4e11-8e1e-554fac5da3f0';

const userToken = (roles) =>
  jwt.sign({ user_id: userId, roles }, process.env.JWT_SECRET);

const authHeader = (roles) => `Bearer ${userToken(roles)}`;

const validEvent = {
  title: 'Prueba E-04',
  startsAt: '2026-11-03T10:00:00-06:00',
  endsAt: '2026-11-03T11:30:00-06:00',
  modality: 'Presencial',
  location: 'Oficinas ADAX',
  description: 'Evento de prueba del endpoint',
};

// The tests write to the shared table, so every event they create is removed at the end
const createdEventIds = [];

afterAll(async () => {
  await supabase.from('event').delete().in('event_id', createdEventIds);
});

describe('Unit tests for E-04', () => {
  describe('POST /api/events - register a new event', () => {
    describe('It contains no authorization token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app)
          .post('/api/events')
          .send(validEvent);

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Token is required.');
      });
    });

    describe('The token belongs to an external user', () => {
      it('Should respond with code 403', async () => {
        const response = await request(app)
          .post('/api/events')
          .set('Authorization', authHeader(['external']))
          .send(validEvent);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('You do not have permission');
      });
    });

    describe('It contains an empty body', () => {
      it('Should respond with code 400 and the error of every required field', async () => {
        const response = await request(app)
          .post('/api/events')
          .set('Authorization', authHeader(['internal']))
          .send({});

        expect(response.statusCode).toBe(400);
        expect(Object.keys(response.body.errors)).toEqual([
          'title',
          'description',
          'startsAt',
          'endsAt',
          'modality',
        ]);
      });
    });

    describe('It contains an in-person event without location', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .post('/api/events')
          .set('Authorization', authHeader(['internal']))
          .send({ ...validEvent, location: '   ' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
          'location is required when modality is Presencial'
        );
      });
    });

    describe('It contains a complete event', () => {
      it('Should respond with code 201 and the saved event', async () => {
        const response = await request(app)
          .post('/api/events')
          .set('Authorization', authHeader(['internal']))
          .send(validEvent);

        createdEventIds.push(response.body.data.eventId);

        expect(response.statusCode).toBe(201);
        expect(response.body.data).toMatchObject({
          eventId: expect.any(String),
          title: validEvent.title,
          modality: validEvent.modality,
          location: validEvent.location,
          description: validEvent.description,
        });
      });
    });

    describe('It contains a title with a SQL instruction', () => {
      it('Should respond with code 201 and save the title as plain text', async () => {
        const title = "x'); drop table event;--";

        const response = await request(app)
          .post('/api/events')
          .set('Authorization', authHeader(['internal']))
          .send({ ...validEvent, title });

        createdEventIds.push(response.body.data.eventId);

        expect(response.statusCode).toBe(201);
        expect(response.body.data.title).toBe(title);
      });
    });
  });
});
