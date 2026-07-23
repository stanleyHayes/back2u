import 'reflect-metadata';
import './../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildContainer } from '../../src/composition/container.js';
import { buildApp } from '../../src/interfaces/http/app.js';
import { startMongo, stopMongo } from '../helpers/mongo.js';

describe('HTTP smoke', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    await startMongo();
    app = buildApp(buildContainer());
  });
  afterAll(async () => stopMongo());

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.version).toBeTruthy();
  });

  it('GET /v1/openapi.json returns the spec', async () => {
    const res = await request(app).get('/v1/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.paths['/v1/auth/login']).toBeTruthy();
  });

  it('POST /v1/auth/register validates payload', async () => {
    const res = await request(app).post('/v1/auth/register').send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation');
  });

  it('register → login → /me round-trip', async () => {
    const reg = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'h@b.co', password: 'password123', name: 'H' });
    expect(reg.status).toBe(201);
    const token = reg.body.data.tokens.accessToken;
    const me = await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('h@b.co');
  });

  it('bearer-required route rejects without token', async () => {
    const res = await request(app).get('/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
