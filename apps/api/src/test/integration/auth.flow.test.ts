import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';

describe('Auth flow (integration)', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    await startTestMongo();
    app = buildApp(buildTestContainer());
    await ensureTestIndexes();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  beforeEach(async () => {
    await clearTestMongo();
  });

  it('registers, logs in, fetches me, refreshes, and logs out', async () => {
    const registerRes = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'password123', name: 'Alice' });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.user.email).toBe('alice@example.com');

    const { accessToken, refreshToken } = registerRes.body.data.tokens;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    const meRes = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('alice@example.com');

    const loginRes = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe('alice@example.com');

    const refreshRes = await request(app)
      .post('/v1/auth/refresh')
      .send({ refreshToken: loginRes.body.data.tokens.refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.tokens.accessToken).toBeTruthy();
    expect(refreshRes.body.data.tokens.refreshToken).not.toBe(loginRes.body.data.tokens.refreshToken);

    const logoutRes = await request(app)
      .post('/v1/auth/logout')
      .send({ refreshToken: refreshRes.body.data.tokens.refreshToken });
    expect(logoutRes.status).toBe(200);

    const staleRefreshRes = await request(app)
      .post('/v1/auth/refresh')
      .send({ refreshToken: refreshRes.body.data.tokens.refreshToken });
    expect(staleRefreshRes.status).toBe(401);
  });

  it('rejects registration with duplicate email', async () => {
    await request(app)
      .post('/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', name: 'A' });

    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', name: 'B' });
    expect(res.status).toBe(409);
  });

  it('rejects me endpoint without token', async () => {
    const res = await request(app).get('/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
