import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { IUserRepository } from '../../application/ports/repositories.js';
import { getAuthToken } from '../auth-helper.js';

describe('Courier job lifecycle (integration)', () => {
  let app: ReturnType<typeof buildApp>;
  let container: ReturnType<typeof buildTestContainer>;

  const place = {
    name: 'KNUST',
    point: { type: 'Point' as const, coordinates: [-1.567, 6.673] as [number, number] },
  };

  beforeAll(async () => {
    await startTestMongo();
    container = buildTestContainer();
    app = buildApp(container);
    await ensureTestIndexes();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  beforeEach(async () => {
    await clearTestMongo();
  });

  it('request → accept → pickup → in_transit → deliver', async () => {
    const regReq = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'requester@example.com', password: 'password123', name: 'Requester' });
    expect(regReq.status).toBe(201);
    const reqToken = regReq.body.data.tokens.accessToken;
    const reqId = regReq.body.data.user.id;

    const itemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title: 'Brown leather wallet',
        description: 'Contains ID cards',
        category: 'Accessories',
        images: [{ url: 'https://example.com/wallet.jpg', publicId: 'w1' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(itemRes.status).toBe(201);
    const itemId = itemRes.body.data.id;

    const jobRes = await request(app)
      .post('/v1/courier/jobs')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        itemId,
        pickup: place,
        dropoff: { name: 'Home', point: { type: 'Point', coordinates: [-1.56, 6.67] } },
        fee: 50,
      });
    expect(jobRes.status).toBe(201);
    const jobId = jobRes.body.data.id;
    expect(jobRes.body.data.status).toBe('requested');
    expect(jobRes.body.data.requesterId).toBe(reqId);
    expect(jobRes.body.data.pickupCode).toBeTruthy();
    expect(jobRes.body.data.deliveryCode).toBeTruthy();

    const regCour = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'courier@example.com', password: 'password123', name: 'Courier' });
    expect(regCour.status).toBe(201);
    const courToken = regCour.body.data.tokens.accessToken;
    const courId = regCour.body.data.user.id;

    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    const courierUser = await users.findById(courId);
    expect(courierUser).toBeTruthy();
    courierUser!.updateRoles([...courierUser!.roles, 'courier']);
    await users.save(courierUser!);

    const courTokenWithRole = getAuthToken(container, courId, ['user', 'courier'], 'courier@example.com');

    const acceptRes = await request(app)
      .post(`/v1/courier/jobs/${jobId}/accept`)
      .set('Authorization', `Bearer ${courTokenWithRole}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('accepted');
    expect(acceptRes.body.data.riderId).toBe(courId);

    const getRes = await request(app)
      .get(`/v1/courier/jobs/${jobId}`)
      .set('Authorization', `Bearer ${reqToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe('accepted');

    const pickupRes = await request(app)
      .post(`/v1/courier/jobs/${jobId}/transition`)
      .set('Authorization', `Bearer ${courTokenWithRole}`)
      .send({ transition: 'pickup', code: jobRes.body.data.pickupCode });
    expect(pickupRes.status).toBe(200);
    expect(pickupRes.body.data.status).toBe('picked_up');

    const transitRes = await request(app)
      .post(`/v1/courier/jobs/${jobId}/transition`)
      .set('Authorization', `Bearer ${courTokenWithRole}`)
      .send({ transition: 'in_transit' });
    expect(transitRes.status).toBe(200);
    expect(transitRes.body.data.status).toBe('in_transit');

    const deliverRes = await request(app)
      .post(`/v1/courier/jobs/${jobId}/transition`)
      .set('Authorization', `Bearer ${courTokenWithRole}`)
      .send({ transition: 'deliver', code: jobRes.body.data.deliveryCode });
    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.data.status).toBe('delivered');
  });

  it('lists nearby open jobs sorted by distance with estimates', async () => {
    const regReq = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'req2@example.com', password: 'password123', name: 'Requester2' });
    expect(regReq.status).toBe(201);
    const reqToken = regReq.body.data.tokens.accessToken;

    const itemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title: 'Phone',
        description: 'Black phone',
        category: 'Electronics',
        images: [{ url: 'https://example.com/phone.jpg', publicId: 'p1' }],
        place: { name: 'Mall', point: { type: 'Point', coordinates: [-1.57, 6.68] } },
        occurredAt: new Date().toISOString(),
      });
    expect(itemRes.status).toBe(201);

    await request(app)
      .post('/v1/courier/jobs')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        itemId: itemRes.body.data.id,
        pickup: { name: 'Mall', point: { type: 'Point', coordinates: [-1.57, 6.68] } },
        dropoff: { name: 'Office', point: { type: 'Point', coordinates: [-1.55, 6.69] } },
        fee: 40,
      });

    const regCour = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'cour2@example.com', password: 'password123', name: 'Courier2' });
    expect(regCour.status).toBe(201);
    const courId = regCour.body.data.user.id;

    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    const courierUser = await users.findById(courId);
    courierUser!.updateRoles([...courierUser!.roles, 'courier']);
    await users.save(courierUser!);

    const courTokenWithRole = getAuthToken(container, courId, ['user', 'courier'], 'cour2@example.com');

    const nearbyRes = await request(app)
      .get('/v1/courier/jobs/open/nearby?lng=-1.567&lat=6.673&radius=50000')
      .set('Authorization', `Bearer ${courTokenWithRole}`);
    expect(nearbyRes.status).toBe(200);
    expect(Array.isArray(nearbyRes.body.data)).toBe(true);
    expect(nearbyRes.body.data.length).toBeGreaterThanOrEqual(1);
    const first = nearbyRes.body.data[0];
    expect(first.estimatedDistanceKm).toBeDefined();
    expect(first.estimatedDurationMin).toBeDefined();
  });

  it('calculates an optimized route across multiple jobs', async () => {
    const regReq = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'req3@example.com', password: 'password123', name: 'Requester3' });
    expect(regReq.status).toBe(201);
    const reqToken = regReq.body.data.tokens.accessToken;

    const jobs: string[] = [];
    const places = [
      { name: 'A', coords: [-1.58, 6.66] as [number, number], drop: [-1.57, 6.67] as [number, number] },
      { name: 'B', coords: [-1.60, 6.65] as [number, number], drop: [-1.59, 6.66] as [number, number] },
    ];

    for (const p of places) {
      const itemRes = await request(app)
        .post('/v1/items')
        .set('Authorization', `Bearer ${reqToken}`)
        .send({
          kind: 'lost',
          classification: 'lost',
          title: `Item ${p.name}`,
          description: 'Test',
          category: 'Other',
          images: [{ url: 'https://example.com/x.jpg', publicId: 'x1' }],
          place: { name: p.name, point: { type: 'Point', coordinates: p.coords } },
          occurredAt: new Date().toISOString(),
        });
      expect(itemRes.status).toBe(201);

      const jobRes = await request(app)
        .post('/v1/courier/jobs')
        .set('Authorization', `Bearer ${reqToken}`)
        .send({
          itemId: itemRes.body.data.id,
          pickup: { name: p.name, point: { type: 'Point', coordinates: p.coords } },
          dropoff: { name: `${p.name}-drop`, point: { type: 'Point', coordinates: p.drop } },
          fee: 20,
        });
      expect(jobRes.status).toBe(201);
      jobs.push(jobRes.body.data.id);
    }

    const regCour = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'cour3@example.com', password: 'password123', name: 'Courier3' });
    expect(regCour.status).toBe(201);
    const courId = regCour.body.data.user.id;

    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    const courierUser = await users.findById(courId);
    courierUser!.updateRoles([...courierUser!.roles, 'courier']);
    await users.save(courierUser!);

    const courTokenWithRole = getAuthToken(container, courId, ['user', 'courier'], 'cour3@example.com');

    const routeRes = await request(app)
      .post('/v1/courier/route')
      .set('Authorization', `Bearer ${courTokenWithRole}`)
      .send({ jobIds: jobs, riderLng: -1.567, riderLat: 6.673 });
    expect(routeRes.status).toBe(200);
    expect(routeRes.body.data.totalDistanceKm).toBeGreaterThan(0);
    expect(routeRes.body.data.estimatedDurationMin).toBeGreaterThan(0);
    expect(routeRes.body.data.waypoints.length).toBe(jobs.length);
    expect(routeRes.body.data.waypoints.map((w: { jobId: string }) => w.jobId).sort()).toEqual(jobs.sort());
  });
});
