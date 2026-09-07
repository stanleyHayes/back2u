import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { getAuthToken } from '../auth-helper.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { IItemRepository } from '../../application/ports/repositories.js';
import type { ITokenService } from '../../application/ports/services.js';
import { newId } from '../../domain/shared/id.js';

/**
 * Guards against two cross-tenant holes: a caller claiming another
 * organisation's custody (which grants the strongest reward multiplier at
 * settlement), and a partner reading another partner's redemptions.
 */
describe('Cross-tenant guards (integration)', () => {
  let app: ReturnType<typeof buildApp>;
  let container: ReturnType<typeof buildTestContainer>;

  const place = {
    name: 'KNUST',
    point: { type: 'Point' as const, coordinates: [-1.567, 6.673] as [number, number] },
  };

  const itemBody = (institutionId?: string) => ({
    kind: 'found',
    classification: 'lost',
    title: 'Black leather wallet',
    description: 'Found near the north gate',
    category: 'Wallet',
    images: [{ url: 'https://example.com/w.jpg', publicId: 'w1' }],
    place,
    occurredAt: new Date().toISOString(),
    ...(institutionId ? { institutionId } : {}),
  });

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

  /** An access token carrying a partner_admin scope for one institution. */
  const partnerToken = (userId: string, institutionId: string, email: string): string =>
    container
      .get<ITokenService>(TOKENS.TokenService)
      .signAccess({ sub: userId, roles: ['partner_admin'], email, institutionId }).token;

  const register = async (email: string) => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email, password: 'password123', name: 'Tester' });
    expect(res.status).toBe(201);
    return {
      token: res.body.data.tokens.accessToken as string,
      id: res.body.data.user.id as string,
    };
  };

  it('refuses an item posted under an organisation the caller does not belong to', async () => {
    const user = await register('outsider@example.com');
    const res = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${user.token}`)
      .send(itemBody(newId()));
    expect(res.status).toBe(403);
  });

  it('still accepts an item with no institution claim', async () => {
    const user = await register('ordinary@example.com');
    const res = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${user.token}`)
      .send(itemBody());
    expect(res.status).toBe(201);
    expect(res.body.data.institutionId).toBeUndefined();
  });

  it('lets a member post under their own organisation', async () => {
    const user = await register('staffer@example.com');
    const institutionId = newId();
    const token = partnerToken(user.id, institutionId, 'staffer@example.com');

    const res = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${token}`)
      .send(itemBody(institutionId));
    expect(res.status).toBe(201);

    const items = container.get<IItemRepository>(TOKENS.ItemRepository);
    const saved = await items.findById(res.body.data.id);
    expect(saved!.snapshot.institutionId).toBe(institutionId);
  });

  it("refuses a partner reading another institution's redemptions", async () => {
    const token = partnerToken(newId(), newId(), 'partner@example.com');
    const res = await request(app)
      .get(`/v1/redemptions/institution/${newId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('lets a platform admin read any institution’s redemptions', async () => {
    const adminTok = getAuthToken(container, newId(), ['admin'], 'admin@bak2me.com');
    const res = await request(app)
      .get(`/v1/redemptions/institution/${newId()}`)
      .set('Authorization', `Bearer ${adminTok}`);
    // 404 (institution absent) proves the tenancy guard was not the blocker.
    expect(res.status).toBe(404);
  });
});
