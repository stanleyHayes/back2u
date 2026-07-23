import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { GenerateMatchesUseCase } from '../../application/use-cases/match/generate-matches.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { IRewardRepository } from '../../application/ports/repositories.js';

describe('Item + Match flow (integration)', () => {
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

  it('lost item → found item → match generation → accept match → reward created', async () => {
    const regA = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'password123', name: 'Alice' });
    expect(regA.status).toBe(201);
    const tokenA = regA.body.data.tokens.accessToken;

    const lostItemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title: 'Black backpack',
        description: 'Red zipper',
        category: 'Bag',
        images: [{ url: 'https://example.com/bag.jpg', publicId: 'bag1' }],
        place,
        occurredAt: new Date().toISOString(),
        rewardAmount: 100,
      });
    expect(lostItemRes.status).toBe(201);
    const lostItemId = lostItemRes.body.data.id;
    expect(lostItemRes.body.data.rewardId).toBeTruthy();

    const regB = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'bob@example.com', password: 'password123', name: 'Bob' });
    expect(regB.status).toBe(201);
    const tokenB = regB.body.data.tokens.accessToken;

    const foundItemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        kind: 'found',
        classification: 'lost',
        title: 'Black backpack',
        description: 'Red zipper found near library',
        category: 'Bag',
        images: [{ url: 'https://example.com/bag2.jpg', publicId: 'bag2' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(foundItemRes.status).toBe(201);
    const foundItemId = foundItemRes.body.data.id;

    await container.get(GenerateMatchesUseCase).execute(lostItemId);

    const matchesRes = await request(app)
      .get(`/v1/items/${lostItemId}/matches`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(matchesRes.status).toBe(200);
    expect(matchesRes.body.data).toBeInstanceOf(Array);
    expect(matchesRes.body.data.length).toBeGreaterThanOrEqual(1);

    const match = matchesRes.body.data[0];
    expect(match.status).toBe('suggested');
    expect(match.lostItemId).toBe(lostItemId);
    expect(match.foundItemId).toBe(foundItemId);

    const acceptRes = await request(app)
      .post(`/v1/matches/${match.id}/accept`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('accepted');

    const gotLost = await request(app).get(`/v1/items/${lostItemId}`);
    expect(gotLost.body.data.status).toBe('matched');

    const gotFound = await request(app).get(`/v1/items/${foundItemId}`);
    expect(gotFound.body.data.status).toBe('matched');

    const rewards = container.get<IRewardRepository>(TOKENS.RewardRepository);
    const reward = await rewards.findById(lostItemRes.body.data.rewardId);
    expect(reward).toBeTruthy();
    expect(reward!.snapshot.status).toBe('held');
    expect(reward!.snapshot.amount).toBe(100);
  });

  it('accept match → confirm return by both parties → items marked returned', async () => {
    const regA = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'alice2@example.com', password: 'password123', name: 'Alice' });
    expect(regA.status).toBe(201);
    const tokenA = regA.body.data.tokens.accessToken;
    const userA = regA.body.data.user;

    const lostItemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title: 'Blue wallet',
        description: 'Leather',
        category: 'Wallet',
        images: [{ url: 'https://example.com/wallet.jpg', publicId: 'w1' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(lostItemRes.status).toBe(201);
    const lostItemId = lostItemRes.body.data.id;

    const regB = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'bob2@example.com', password: 'password123', name: 'Bob' });
    expect(regB.status).toBe(201);
    const tokenB = regB.body.data.tokens.accessToken;
    const userB = regB.body.data.user;

    const foundItemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        kind: 'found',
        classification: 'lost',
        title: 'Blue wallet',
        description: 'Leather found near library',
        category: 'Wallet',
        images: [{ url: 'https://example.com/wallet2.jpg', publicId: 'w2' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(foundItemRes.status).toBe(201);
    const foundItemId = foundItemRes.body.data.id;

    await container.get(GenerateMatchesUseCase).execute(lostItemId);

    const matchesRes = await request(app)
      .get(`/v1/items/${lostItemId}/matches`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(matchesRes.status).toBe(200);
    const match = matchesRes.body.data[0];

    await request(app)
      .post(`/v1/matches/${match.id}/accept`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const confirmA = await request(app)
      .post(`/v1/matches/${match.id}/confirm-return`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(confirmA.status).toBe(200);
    expect(confirmA.body.data.returnConfirmedByLost).toBe(userA.id);
    expect(confirmA.body.data.returnConfirmedByFound).toBeUndefined();
    expect(confirmA.body.data.returnedAt).toBeUndefined();

    const gotLostAfterOne = await request(app).get(`/v1/items/${lostItemId}`);
    expect(gotLostAfterOne.body.data.status).toBe('matched');

    const confirmB = await request(app)
      .post(`/v1/matches/${match.id}/confirm-return`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(confirmB.status).toBe(200);
    expect(confirmB.body.data.returnConfirmedByLost).toBe(userA.id);
    expect(confirmB.body.data.returnConfirmedByFound).toBe(userB.id);
    expect(confirmB.body.data.returnedAt).toBeTruthy();

    const gotLostAfterBoth = await request(app).get(`/v1/items/${lostItemId}`);
    expect(gotLostAfterBoth.body.data.status).toBe('returned');

    const gotFoundAfterBoth = await request(app).get(`/v1/items/${foundItemId}`);
    expect(gotFoundAfterBoth.body.data.status).toBe('returned');

    const meA = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(meA.body.data.successfulReturns).toBe(1);
    expect(meA.body.data.pointsBalance).toBe(50);

    const meB = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(meB.body.data.successfulReturns).toBe(1);
    expect(meB.body.data.pointsBalance).toBe(50);
  });
});
