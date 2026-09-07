import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { getAuthToken } from '../auth-helper.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { ExpireReservationsUseCase } from '../../application/use-cases/reward_catalog/reward-catalog.use-cases.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type {
  IInstitutionRepository,
  IUserRepository,
} from '../../application/ports/repositories.js';
import type { IRewardOfferRepository } from '../../application/ports/reward-catalog-repos.js';
import type { ITokenService } from '../../application/ports/services.js';
import { Institution } from '../../domain/institution/institution.entity.js';
import { User } from '../../domain/user/user.entity.js';
import { newId } from '../../domain/shared/id.js';

const place = {
  name: 'Accra Mall',
  point: { type: 'Point' as const, coordinates: [-0.17, 5.62] as [number, number] },
};

describe('Rewards marketplace flow (integration)', () => {
  let app: ReturnType<typeof buildApp>;
  let container: ReturnType<typeof buildTestContainer>;

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

  /** Seeds a member with a starting BakPoints balance and trust level. */
  const seedUser = async (
    email: string,
    opts: { points?: number; trust?: Parameters<User['setTrust']>[1] } = {},
  ) => {
    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    const user = User.create({ id: newId(), email, name: email, passwordHash: 'x' });
    if (opts.trust) user.setTrust(70, opts.trust);
    await users.save(user);
    if (opts.points) await users.incrementPoints(user.id, opts.points);
    return { id: user.id, token: getAuthToken(container, user.id, ['user'], email) };
  };

  const seedInstitution = async (): Promise<string> => {
    const institutions = container.get<IInstitutionRepository>(TOKENS.InstitutionRepository);
    const institution = Institution.onboard({
      id: newId(),
      name: 'Vodafone Ghana',
      type: 'retail',
      contactEmail: 'rewards@vodafone.example',
      place,
      pointsRedeemable: true,
    });
    await institutions.save(institution);
    return institution.snapshot.id;
  };

  const partnerToken = (institutionId: string) =>
    container.get<ITokenService>(TOKENS.TokenService).signAccess({
      sub: newId(),
      roles: ['partner_admin'],
      email: 'partner@ex.com',
      institutionId,
    }).token;

  const offerBody = (over: Record<string, unknown> = {}) => ({
    title: '1GB mobile data',
    description: 'Valid on MTN for 30 days',
    category: 'mobile_data',
    pointsCost: 50,
    ...over,
  });

  it('runs draft → live → reserve → collect, with the ledger and stock in step', async () => {
    const institutionId = await seedInstitution();
    const token = partnerToken(institutionId);
    const member = await seedUser('member@ex.com', { points: 200 });

    const created = await request(app)
      .post('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${token}`)
      .send(offerBody({ totalInventory: 2, perUserLimit: 1 }));
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('draft');
    expect(created.body.data.remainingInventory).toBe(2);
    const offerId = created.body.data.id as string;

    // A draft is invisible to members.
    const hidden = await request(app)
      .get('/v1/reward-catalog')
      .set('Authorization', `Bearer ${member.token}`);
    expect(hidden.body.data.total).toBe(0);

    await request(app)
      .patch(`/v1/reward-catalog/manage/${offerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'live' })
      .expect(200);

    const catalog = await request(app)
      .get('/v1/reward-catalog')
      .set('Authorization', `Bearer ${member.token}`);
    expect(catalog.body.data.total).toBe(1);
    expect(catalog.body.data.offers[0].eligible).toBe(true);
    expect(catalog.body.data.offers[0].institutionName).toBe('Vodafone Ghana');

    const reserved = await request(app)
      .post(`/v1/reward-catalog/${offerId}/reserve`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(reserved.status).toBe(201);
    expect(reserved.body.data.status).toBe('pending');
    expect(reserved.body.data.offerTitle).toBe('1GB mobile data');
    expect(reserved.body.data.expiresAt).toBeTruthy();

    // Points are spent up front and land on the ledger.
    const summary = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${member.token}`);
    expect(summary.body.data.balance).toBe(150);
    const ledger = await request(app)
      .get('/v1/points/ledger')
      .set('Authorization', `Bearer ${member.token}`);
    expect(ledger.body.data.entries[0].action).toBe('redemption_spend');
    expect(ledger.body.data.entries[0].points).toBe(-50);

    // Stock came out of the pool immediately.
    const offers = container.get<IRewardOfferRepository>(TOKENS.RewardOfferRepository);
    expect((await offers.findById(offerId))!.snapshot.remainingInventory).toBe(1);

    // The per-user limit blocks a second claim.
    const again = await request(app)
      .post(`/v1/reward-catalog/${offerId}/reserve`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(again.status).toBe(409);

    // The partner collects it at the counter with the existing code flow.
    const collected = await request(app)
      .post('/v1/redemptions/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: reserved.body.data.code });
    expect(collected.status).toBe(200);
    expect(collected.body.data.status).toBe('fulfilled');
  });

  it('refuses a member who cannot afford it, and says so in the catalogue', async () => {
    const institutionId = await seedInstitution();
    const token = partnerToken(institutionId);
    const broke = await seedUser('broke@ex.com', { points: 10 });

    const created = await request(app)
      .post('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${token}`)
      .send(offerBody());
    await request(app)
      .patch(`/v1/reward-catalog/manage/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'live' })
      .expect(200);

    const catalog = await request(app)
      .get('/v1/reward-catalog')
      .set('Authorization', `Bearer ${broke.token}`);
    expect(catalog.body.data.offers[0].eligible).toBe(false);
    expect(catalog.body.data.offers[0].ineligibleReason).toMatch(/enough BakPoints/i);

    const res = await request(app)
      .post(`/v1/reward-catalog/${created.body.data.id}/reserve`)
      .set('Authorization', `Bearer ${broke.token}`);
    expect(res.status).toBe(409);
  });

  it('gates a reward on community standing (§16)', async () => {
    const institutionId = await seedInstitution();
    const token = partnerToken(institutionId);
    const newcomer = await seedUser('newcomer@ex.com', { points: 500 });
    const trusted = await seedUser('trusted@ex.com', { points: 500, trust: 'guardian' });

    const created = await request(app)
      .post('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${token}`)
      .send(offerBody({ minTrustLevel: 'trusted_finder' }));
    const offerId = created.body.data.id as string;
    await request(app)
      .patch(`/v1/reward-catalog/manage/${offerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'live' })
      .expect(200);

    const blocked = await request(app)
      .post(`/v1/reward-catalog/${offerId}/reserve`)
      .set('Authorization', `Bearer ${newcomer.token}`);
    expect(blocked.status).toBe(403);

    const allowed = await request(app)
      .post(`/v1/reward-catalog/${offerId}/reserve`)
      .set('Authorization', `Bearer ${trusted.token}`);
    expect(allowed.status).toBe(201);
  });

  it('never oversells the last unit under concurrent reservations', async () => {
    const institutionId = await seedInstitution();
    const token = partnerToken(institutionId);
    const created = await request(app)
      .post('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${token}`)
      .send(offerBody({ totalInventory: 1 }));
    const offerId = created.body.data.id as string;
    await request(app)
      .patch(`/v1/reward-catalog/manage/${offerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'live' })
      .expect(200);

    const racers = await Promise.all(
      ['a@ex.com', 'b@ex.com', 'c@ex.com'].map((e) => seedUser(e, { points: 500 })),
    );
    const results = await Promise.all(
      racers.map((u) =>
        request(app)
          .post(`/v1/reward-catalog/${offerId}/reserve`)
          .set('Authorization', `Bearer ${u.token}`),
      ),
    );

    // Exactly one wins; the atomic stock decrement is what guarantees it.
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(2);

    const offers = container.get<IRewardOfferRepository>(TOKENS.RewardOfferRepository);
    expect((await offers.findById(offerId))!.snapshot.remainingInventory).toBe(0);

    // The two who lost keep their points.
    for (const loser of racers.filter((_, i) => results[i]!.status === 409)) {
      const s = await request(app)
        .get('/v1/points/summary')
        .set('Authorization', `Bearer ${loser.token}`);
      expect(s.body.data.balance).toBe(500);
    }
  });

  it('expires an uncollected reservation, returning both the points and the stock', async () => {
    const institutionId = await seedInstitution();
    const token = partnerToken(institutionId);
    const member = await seedUser('slow@ex.com', { points: 200 });

    const created = await request(app)
      .post('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${token}`)
      .send(offerBody({ totalInventory: 1, reservationHours: 1 }));
    const offerId = created.body.data.id as string;
    await request(app)
      .patch(`/v1/reward-catalog/manage/${offerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'live' })
      .expect(200);

    await request(app)
      .post(`/v1/reward-catalog/${offerId}/reserve`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(201);

    const offers = container.get<IRewardOfferRepository>(TOKENS.RewardOfferRepository);
    expect((await offers.findById(offerId))!.snapshot.remainingInventory).toBe(0);

    const expiry = container.get(ExpireReservationsUseCase);
    // Nothing is due yet.
    expect(await expiry.execute(new Date())).toEqual({ expired: 0 });

    const result = await expiry.execute(new Date(Date.now() + 2 * 3_600_000));
    expect(result.expired).toBe(1);

    const summary = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${member.token}`);
    expect(summary.body.data.balance).toBe(200);
    expect((await offers.findById(offerId))!.snapshot.remainingInventory).toBe(1);

    // A second sweep must not refund twice.
    expect(await expiry.execute(new Date(Date.now() + 3 * 3_600_000))).toEqual({ expired: 0 });
    const after = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${member.token}`);
    expect(after.body.data.balance).toBe(200);
  });

  it('keeps one partner out of another partner’s catalogue', async () => {
    const [instA, instB] = await Promise.all([seedInstitution(), seedInstitution()]);
    const tokenA = partnerToken(instA);
    const tokenB = partnerToken(instB);

    const created = await request(app)
      .post('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(offerBody());

    const res = await request(app)
      .patch(`/v1/reward-catalog/manage/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ pointsCost: 1 });
    expect(res.status).toBe(403);

    const listB = await request(app)
      .get('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listB.body.data).toHaveLength(0);
  });

  it('reports redemption analytics to the partner', async () => {
    const institutionId = await seedInstitution();
    const token = partnerToken(institutionId);
    const member = await seedUser('analytics@ex.com', { points: 500 });

    const created = await request(app)
      .post('/v1/reward-catalog/manage')
      .set('Authorization', `Bearer ${token}`)
      .send(offerBody({ totalInventory: 5 }));
    const offerId = created.body.data.id as string;
    await request(app)
      .patch(`/v1/reward-catalog/manage/${offerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'live' })
      .expect(200);

    const reserved = await request(app)
      .post(`/v1/reward-catalog/${offerId}/reserve`)
      .set('Authorization', `Bearer ${member.token}`);
    await request(app)
      .post('/v1/redemptions/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: reserved.body.data.code })
      .expect(200);

    const analytics = await request(app)
      .get('/v1/reward-catalog/manage/analytics')
      .set('Authorization', `Bearer ${token}`);
    expect(analytics.status).toBe(200);
    expect(analytics.body.data.liveOffers).toBe(1);
    expect(analytics.body.data.totalRedeemed).toBe(1);
    expect(analytics.body.data.totalPointsSpent).toBe(50);
    expect(analytics.body.data.offers[0].collectionRate).toBe(1);
  });
});
