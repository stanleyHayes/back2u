import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';

/**
 * The auth surface has two independent budgets: a tight per-ACCOUNT one that
 * stops credential stuffing, and a generous per-IP one so a shared NAT — a
 * campus, an office, a mobile carrier — is not locked out wholesale.
 */
describe('Auth rate limiting (integration)', () => {
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

  const attempt = (email: string) =>
    request(app).post('/v1/auth/login').send({ email, password: 'wrong-password-here' });

  it('locks out repeated attempts against ONE account', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 14; i++) {
      statuses.push((await attempt('victim@example.com')).status);
    }
    expect(statuses).toContain(429);
    // The limiter must engage well before 14 guesses land on one account.
    expect(statuses.indexOf(429)).toBeLessThanOrEqual(11);
  });

  it('does not punish a different account sharing the same IP', async () => {
    for (let i = 0; i < 14; i++) await attempt('victim2@example.com');
    // Same source IP, different account: this user must still be served.
    const other = await attempt('bystander@example.com');
    expect(other.status).not.toBe(429);
  });

  it('keeps token refresh off the credential budget', async () => {
    for (let i = 0; i < 14; i++) await attempt('victim3@example.com');
    // Refresh is a background call every signed-in client makes; sharing the
    // credential budget with it would silently sign out a whole building.
    const refreshed = await request(app)
      .post('/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' });
    expect(refreshed.status).not.toBe(429);
  });
});
