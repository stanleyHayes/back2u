import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { GenerateMatchesUseCase } from '../../application/use-cases/match/generate-matches.js';
import { ReleaseRewardUseCase } from '../../application/use-cases/reward/release-reward.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { IRewardRepository } from '../../application/ports/repositories.js';

describe('Reward release flow (integration)', () => {
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

  it('escrow hold → match → return confirmation → reward release → finder gets points', async () => {
    // Alice posts lost item with reward
    const regA = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'password123', name: 'Alice' });
    expect(regA.status).toBe(201);
    const tokenA = regA.body.data.tokens.accessToken;
    const userA = regA.body.data.user;

    const lostItemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title: 'Gold ring',
        description: 'Wedding band',
        category: 'Jewelry',
        images: [{ url: 'https://example.com/ring.jpg', publicId: 'r1' }],
        place,
        occurredAt: new Date().toISOString(),
        rewardAmount: 5000,
      });
    expect(lostItemRes.status).toBe(201);
    const lostItemId = lostItemRes.body.data.id;
    const rewardId = lostItemRes.body.data.rewardId;
    expect(rewardId).toBeTruthy();

    // Bob posts found item
    const regB = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'bob@example.com', password: 'password123', name: 'Bob' });
    expect(regB.status).toBe(201);
    const tokenB = regB.body.data.tokens.accessToken;
    const userB = regB.body.data.user;

    const foundItemRes = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        kind: 'found',
        classification: 'lost',
        title: 'Gold ring',
        description: 'Wedding band found near library',
        category: 'Jewelry',
        images: [{ url: 'https://example.com/ring2.jpg', publicId: 'r2' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(foundItemRes.status).toBe(201);
    const foundItemId = foundItemRes.body.data.id;

    // Generate matches
    await container.get(GenerateMatchesUseCase).execute(lostItemId);

    const matchesRes = await request(app)
      .get(`/v1/items/${lostItemId}/matches`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(matchesRes.status).toBe(200);
    const match = matchesRes.body.data[0];

    // Accept match
    await request(app)
      .post(`/v1/matches/${match.id}/accept`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Both confirm return
    await request(app)
      .post(`/v1/matches/${match.id}/confirm-return`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    await request(app)
      .post(`/v1/matches/${match.id}/confirm-return`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    // Verify items are returned
    const gotLost = await request(app).get(`/v1/items/${lostItemId}`);
    expect(gotLost.body.data.status).toBe('returned');

    // Release reward
    const releaseRes = await request(app)
      .post(`/v1/rewards/${rewardId}/release`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ finderId: userB.id });
    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.data.status).toBe('released');
    expect(releaseRes.body.data.finderId).toBe(userB.id);

    // Verify reward in repo
    const rewards = container.get<IRewardRepository>(TOKENS.RewardRepository);
    const reward = await rewards.findById(rewardId);
    expect(reward!.snapshot.status).toBe('released');

    // Verify finder gets points and successful return
    // (return confirmation + reward release both increment successfulReturns)
    const meB = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(meB.body.data.successfulReturns).toBe(2);
    expect(meB.body.data.pointsBalance).toBeGreaterThan(0);
  });
});
