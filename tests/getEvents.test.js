import app from '../Source/app.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import EventModel from '../Data/Models/event.model.js';

// Generate a test token with the admin role
const adminToken = jwt.sign(
  { user_id: 'test-admin-user', roles: ['admin'] },
  process.env.JWT_SECRET
);

// Generate a test token with the internal role
const internalToken = jwt.sign(
  { user_id: 'test-internal-user', roles: ['internal'] },
  process.env.JWT_SECRET
);

const RUN_ID = Date.now();
const titleOf = (name) => `[TEST ${RUN_ID}] ${name}`;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const fromNow = (ms) => new Date(Date.now() + ms).toISOString();

// Events created for the tests
const events = {};

const findByTitle = (list, title) =>
  list.find((event) => event.title === title);

beforeAll(async () => {
  events.upcoming = await EventModel.create({
    title: titleOf('Upcoming this month'),
    startsAt: fromNow(60 * 1000),
    endsAt: fromNow(2 * HOUR),
    modality: 'Presencial',
    location: 'Oficinas ADAX',
    link: 'https://example.com/private-link',
    phone: '5555555555',
    description: 'Active event used by the tests',
    notes: 'Trae gorra y a tus amigas',
  });

  events.ongoing = await EventModel.create({
    title: titleOf('Ongoing'),
    startsAt: fromNow(-HOUR),
    endsAt: fromNow(HOUR),
    modality: 'Presencial',
    location: 'Sede Adax',
    description: 'Event already in progress',
  });

  // 40 days ahead is never in the current month
  events.farFuture = await EventModel.create({
    title: titleOf('Far future'),
    startsAt: fromNow(40 * DAY),
    endsAt: fromNow(40 * DAY + 2 * HOUR),
    modality: 'Virtual',
    description: 'Active event outside the current month',
  });

  // Already finished: must not  be listed
  events.finished = await EventModel.create({
    title: titleOf('Finished'),
    startsAt: fromNow(-3 * HOUR),
    endsAt: fromNow(-2 * HOUR),
    modality: 'Presencial',
    description: 'Event that already ended',
  });

  // Disabled (deleted_at)
  const disabled = await EventModel.create({
    title: titleOf('Disabled'),
    startsAt: fromNow(2 * HOUR),
    endsAt: fromNow(3 * HOUR),
    modality: 'Presencial',
    description: 'Event that was disabled',
  });
  await EventModel.disable(disabled.event_id);
  events.disabled = disabled;
});

afterAll(async () => {
  await Promise.all(
    Object.values(events).map((event) => EventModel.disable(event.event_id))
  );
});

// Tests the active events used by the homepage carousel and the events list
describe('Unit tests for the active events HU', () => {
  describe('GET /api/events - list the active events', () => {
    describe('There is no token', () => {
      it('Should respond with code 401', async () => {
        const response = await request(app).get('/api/events');

        expect(response.statusCode).toBe(401);
      });
    });

    describe('It contains an invalid scope', () => {
      it('Should respond with code 400', async () => {
        const response = await request(app)
          .get('/api/events?scope=foo')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    // The endpoint is not internal only  any authenticated user can read events
    describe('The user is not an admin', () => {
      it('Should respond with code 200', async () => {
        const response = await request(app)
          .get('/api/events')
          .set('Authorization', `Bearer ${internalToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('It has no scope (full list)', () => {
      it('Should list the active events, including the ones outside the month', async () => {
        const response = await request(app)
          .get('/api/events')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(
          findByTitle(response.body.data, events.upcoming.title)
        ).toBeDefined();
        expect(
          findByTitle(response.body.data, events.ongoing.title)
        ).toBeDefined();
        expect(
          findByTitle(response.body.data, events.farFuture.title)
        ).toBeDefined();
      });

      it('Should not list finished or disabled events', async () => {
        const response = await request(app)
          .get('/api/events')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(
          findByTitle(response.body.data, events.finished.title)
        ).toBeUndefined();
        expect(
          findByTitle(response.body.data, events.disabled.title)
        ).toBeUndefined();
      });

      it('Should sort the events by start date, the closest first', async () => {
        const response = await request(app)
          .get('/api/events')
          .set('Authorization', `Bearer ${adminToken}`);

        const dates = response.body.data.map((event) =>
          new Date(event.startsAt).getTime()
        );
        const sorted = [...dates].sort((a, b) => a - b);

        expect(dates).toEqual(sorted);
      });
    });

    describe('It has scope=month (carousel)', () => {
      it('Should list the active events of the current month', async () => {
        const response = await request(app)
          .get('/api/events?scope=month')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(
          findByTitle(response.body.data, events.upcoming.title)
        ).toBeDefined();
        expect(
          findByTitle(response.body.data, events.ongoing.title)
        ).toBeDefined();
      });

      it('Should not list events that start in a later month', async () => {
        const response = await request(app)
          .get('/api/events?scope=month')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(
          findByTitle(response.body.data, events.farFuture.title)
        ).toBeUndefined();
      });

      it('Should not list finished or disabled events', async () => {
        const response = await request(app)
          .get('/api/events?scope=month')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(
          findByTitle(response.body.data, events.finished.title)
        ).toBeUndefined();
        expect(
          findByTitle(response.body.data, events.disabled.title)
        ).toBeUndefined();
      });
    });

    describe('It checks the fields of each event', () => {
      it('Should respond with the fields the app cards need', async () => {
        const response = await request(app)
          .get('/api/events')
          .set('Authorization', `Bearer ${adminToken}`);

        const event = findByTitle(response.body.data, events.upcoming.title);

        expect(event).toHaveProperty('id', events.upcoming.event_id);
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('startsAt');
        expect(event).toHaveProperty('endsAt');
        expect(event).toHaveProperty('modality', 'Presencial');
        expect(event).toHaveProperty('location', 'Oficinas ADAX');
        expect(event).toHaveProperty('notes', 'Trae gorra y a tus amigas');
        // Dates travel as ISO strings, the app formats them
        expect(Number.isNaN(Date.parse(event.startsAt))).toBe(false);
      });

      it('Should not expose internal fields', async () => {
        const response = await request(app)
          .get('/api/events')
          .set('Authorization', `Bearer ${adminToken}`);

        const event = findByTitle(response.body.data, events.upcoming.title);
        // Remove the repeated lines of 'notes'
        expect(event).not.toHaveProperty('phone');
        expect(event).not.toHaveProperty('link');
        expect(event).not.toHaveProperty('deleted_at');
        expect(event).not.toHaveProperty('event_id');
      });

      it('Should respond with imageUrl null when the event has no image', async () => {
        const response = await request(app)
          .get('/api/events')
          .set('Authorization', `Bearer ${adminToken}`);

        const event = findByTitle(response.body.data, events.upcoming.title);

        expect(event.imageUrl).toBeNull();
      });
    });
  });
});
