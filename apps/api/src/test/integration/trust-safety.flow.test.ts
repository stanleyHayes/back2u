import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { getAuthToken } from '../auth-helper.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { ClearPendingPointsUseCase } from '../../application/use-cases/points/points.use-cases.js';
import { GenerateMatchesUseCase } from '../../application/use-cases/match/generate-matches.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { IPointLedgerRepository } from '../../application/ports/points-repos.js';
import type { IUserRepository } from '../../application/ports/repositories.js';
import { newId } from '../../domain/shared/id.js';
import { User } from '../../domain/user/user.entity.js';

const MS_PER_DAY = 86_400_000;

describe('Trust & Safety flow (integration)', () => {
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

  const adminToken = (): string => getAuthToken(container, newId(), ['admin'], 'admin@bak2me.com');

  /** Registers a user and returns their token and id. */
  /**
   * Seeds a user directly. Registration is behind a 10-per-5-minute limiter and
   * this suite needs more accounts than that; the repository path also keeps
   * each test independent of auth-flow behaviour.
   */
  const register = async (email: string, name: string) => {
    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    const user = User.create({ id: newId(), email, name, passwordHash: 'x' });
    await users.save(user);
    return { token: getAuthToken(container, user.id, ['user'], email), id: user.id };
  };

  /** Drives one lost/found pair all the way to a mutually confirmed return. */
  const runRecovery = async (
    owner: { token: string },
    finder: { token: string },
    title = 'Blue Samsung phone',
  ): Promise<string> => {
    const lost = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        kind: 'lost',
        classification: 'lost',
        title,
        description: 'Cracked screen protector, blue case',
        category: 'Phone',
        images: [{ url: 'https://example.com/p.jpg', publicId: 'p1' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(lost.status).toBe(201);

    const found = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${finder.token}`)
      .send({
        kind: 'found',
        classification: 'lost',
        title,
        description: 'Cracked screen protector, blue case',
        category: 'Phone',
        images: [{ url: 'https://example.com/p.jpg', publicId: 'p2' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(found.status).toBe(201);

    await container.get(GenerateMatchesUseCase).execute(lost.body.data.id);

    const matches = await request(app)
      .get(`/v1/items/${lost.body.data.id}/matches`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(matches.body.data.length).toBeGreaterThanOrEqual(1);
    const matchId = matches.body.data[0].id as string;

    await request(app)
      .post(`/v1/matches/${matchId}/accept`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    await request(app)
      .post(`/v1/matches/${matchId}/confirm-return`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    await request(app)
      .post(`/v1/matches/${matchId}/confirm-return`)
      .set('Authorization', `Bearer ${finder.token}`)
      .expect(200);

    return matchId;
  };

  it('holds points through the pending period, then clears them once due (§4)', async () => {
    const owner = await register('owner@example.com', 'Owner');
    const finder = await register('finder@example.com', 'Finder');
    await runRecovery(owner, finder);

    const clear = container.get(ClearPendingPointsUseCase);

    // Nothing is due yet, so a clearing pass leaves the balance at zero.
    expect(await clear.execute(new Date())).toEqual({ cleared: 0, held: 0 });
    const beforeDue = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${finder.token}`);
    expect(beforeDue.body.data.balance).toBe(0);
    expect(beforeDue.body.data.pending).toBeGreaterThan(0);

    // Once the holding period elapses the credit becomes spendable.
    const result = await clear.execute(new Date(Date.now() + 30 * MS_PER_DAY));
    expect(result.cleared).toBe(2);

    const after = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${finder.token}`);
    expect(after.body.data.balance).toBeGreaterThan(0);
    expect(after.body.data.pending).toBe(0);
    expect(after.body.data.lifetimeEarned).toBe(after.body.data.balance);
  });

  it('exposes business rules to admins and applies an edit to the next award (§18)', async () => {
    const token = adminToken();

    const initial = await request(app)
      .get('/v1/admin/trust/business-rules')
      .set('Authorization', `Bearer ${token}`);
    expect(initial.status).toBe(200);
    expect(initial.body.data.pointsPerAction.recovery_device).toBe(40);

    const patched = await request(app)
      .patch('/v1/admin/trust/business-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ pointsPerAction: { recovery_device: 90 }, verificationMultipliers: { peer: 1 } });
    expect(patched.status).toBe(200);
    expect(patched.body.data.pointsPerAction.recovery_device).toBe(90);
    // Untouched knobs survive a partial update.
    expect(patched.body.data.pointsPerAction.recovery_ordinary).toBe(25);

    const owner = await register('owner2@example.com', 'Owner');
    const finder = await register('finder2@example.com', 'Finder');
    await runRecovery(owner, finder);

    const ledger = await request(app)
      .get('/v1/points/ledger')
      .set('Authorization', `Bearer ${finder.token}`);
    expect(ledger.body.data.entries[0].points).toBe(90);
  });

  it('rejects an invalid rules edit and leaves the stored rules untouched', async () => {
    const token = adminToken();
    const bad = await request(app)
      .patch('/v1/admin/trust/business-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ riskThresholds: { mediumFrom: 90, highFrom: 20, criticalFrom: 95 } });
    expect(bad.status).toBe(422);

    // A typo in an action name must not add a dead entry to the economy.
    const typo = await request(app)
      .patch('/v1/admin/trust/business-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ pointsPerAction: { recovery_bicycle: 40 } });
    expect(typo.status).toBe(422);

    const after = await request(app)
      .get('/v1/admin/trust/business-rules')
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.data.riskThresholds).toEqual({
      mediumFrom: 31,
      highFrom: 61,
      criticalFrom: 81,
    });
  });

  it('keeps the risk queue and business rules away from ordinary users (§6)', async () => {
    const user = await register('nosy@example.com', 'Nosy');
    for (const path of ['/v1/admin/trust/risk', '/v1/admin/trust/business-rules']) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(403);
    }
    expect((await request(app).get('/v1/admin/trust/risk')).status).toBe(401);
  });

  it('queues a colluding pair for review and reverses their points on confirmed fraud', async () => {
    // Two accounts sharing one payout number and one device is the collusion
    // pattern of §6, and scores straight into the critical band.
    const owner = await register('mallam@example.com', 'Mallam');
    const finder = await register('kofi@example.com', 'Kofi');

    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    for (const id of [owner.id, finder.id]) {
      const u = await users.findById(id);
      u!.updateProfile({ momoNumber: '0244000111' });
      u!.addPushToken('ExponentPushToken[shared-device]');
      await users.save(u!);
    }

    const matchId = await runRecovery(owner, finder);
    const token = adminToken();

    const queue = await request(app)
      .get('/v1/admin/trust/risk')
      .set('Authorization', `Bearer ${token}`);
    expect(queue.status).toBe(200);
    expect(queue.body.data.total).toBe(1);

    const assessment = queue.body.data.items[0];
    expect(assessment.subjectId).toBe(matchId);
    expect(assessment.band).toBe('critical');
    expect(assessment.action).toBe('freeze');
    expect(assessment.ruleHits.map((h: { code: string }) => h.code)).toEqual(
      expect.arrayContaining(['shared_device', 'shared_payout', 'new_account']),
    );

    // A frozen recovery must not clear on the ordinary timetable.
    const clear = container.get(ClearPendingPointsUseCase);
    const held = await clear.execute(new Date(Date.now() + 30 * MS_PER_DAY));
    expect(held).toEqual({ cleared: 0, held: 2 });

    const reviewed = await request(app)
      .post(`/v1/admin/trust/risk/${assessment.id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'confirmed_fraud', note: 'Same handset, same payout number' });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.reviewStatus).toBe('confirmed_fraud');

    // Both awards are reversed, and each colluder carries a penalty on the case.
    const ledger = container.get<IPointLedgerRepository>(TOKENS.PointLedgerRepository);
    const caseEntries = await ledger.listForCase(matchId);
    const awards = caseEntries.filter((e) => e.snapshot.action !== 'fraud_penalty');
    const penalties = caseEntries.filter((e) => e.snapshot.action === 'fraud_penalty');
    expect(awards).toHaveLength(2);
    expect(awards.every((e) => e.status === 'reversed')).toBe(true);
    expect(penalties).toHaveLength(2);
    expect(penalties.every((e) => e.points === -100)).toBe(true);

    for (const id of [owner.id, finder.id]) {
      const u = await users.findById(id);
      expect(u!.snapshot.status).toBe('suspended');
      expect(u!.snapshot.pointsBalance).toBe(-100);
    }

    // A second review of a closed case is rejected.
    const again = await request(app)
      .post(`/v1/admin/trust/risk/${assessment.id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'dismissed' });
    expect(again.status).toBe(409);
  });

  it('credits a recovery only once, however often the return is confirmed', async () => {
    const owner = await register('owner3@example.com', 'Owner');
    const finder = await register('finder3@example.com', 'Finder');
    const matchId = await runRecovery(owner, finder);

    await request(app)
      .post(`/v1/matches/${matchId}/confirm-return`)
      .set('Authorization', `Bearer ${finder.token}`)
      .expect(200);

    const ledger = container.get<IPointLedgerRepository>(TOKENS.PointLedgerRepository);
    expect(await ledger.listForCase(matchId)).toHaveLength(2);
  });

  it('derives the Trust Score, and lets a confirmed fraud pull it down (§16)', async () => {
    const owner = await register('t-owner@example.com', 'Owner');
    const finder = await register('t-finder@example.com', 'Finder');

    const before = await request(app)
      .get('/v1/points/trust')
      .set('Authorization', `Bearer ${finder.token}`);
    expect(before.status).toBe(200);
    expect(before.body.data.level).toBe('new_finder');
    expect(before.body.data.components.map((c: { key: string }) => c.key)).toEqual([
      'identity_confidence',
      'recovery_history',
      'verification_quality',
      'account_integrity',
      'community_history',
    ]);

    // Give the pair a shared payout destination AND a shared device, so the
    // recovery scores into a blocking band and reaches the open queue rather
    // than closing itself out with an extended hold.
    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    for (const id of [owner.id, finder.id]) {
      const u = await users.findById(id);
      u!.updateProfile({ momoNumber: '0244777888' });
      u!.addPushToken('ExponentPushToken[one-handset]');
      await users.save(u!);
    }

    const matchId = await runRecovery(owner, finder);
    const afterRecovery = await request(app)
      .get('/v1/points/trust')
      .set('Authorization', `Bearer ${finder.token}`);
    const recoveredScore = afterRecovery.body.data.score as number;
    expect(recoveredScore).toBeGreaterThan(0);

    // A peer handover carries no independent evidence, so quality stays at 0
    // however many of them there are — that is the §16 anti-farming property.
    const quality = afterRecovery.body.data.components.find(
      (c: { key: string }) => c.key === 'verification_quality',
    );
    expect(quality.value).toBe(0);

    // Confirming fraud must move the score down without anyone editing it.
    const token = adminToken();
    const queue = await request(app)
      .get('/v1/admin/trust/risk')
      .set('Authorization', `Bearer ${token}`);
    const assessment = queue.body.data.items.find(
      (a: { subjectId: string }) => a.subjectId === matchId,
    );
    expect(assessment).toBeDefined();

    await request(app)
      .post(`/v1/admin/trust/risk/${assessment.id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'confirmed_fraud', note: 'Manufactured recovery' })
      .expect(200);

    const suspended = await users.findById(finder.id);
    expect(suspended!.snapshot.status).toBe('suspended');
    // Suspension zeroes account integrity, so the derived score has to fall.
    expect(suspended!.snapshot.trustScore).toBeLessThan(recoveredScore);
    // The deprecated alias must track it rather than drift.
    expect(suspended!.snapshot.reputationScore).toBe(suspended!.snapshot.trustScore);
  });

  it('shows other people only a level, never the breakdown', async () => {
    const a = await register('viewer@example.com', 'Viewer');
    const b = await register('subject@example.com', 'Subject');
    const res = await request(app)
      .get(`/v1/points/trust/${b.id}`)
      .set('Authorization', `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.level).toBe('new_finder');
    expect(res.body.data.components).toBeUndefined();
  });

  it('lets an admin adjust and reverse points by hand', async () => {
    const token = adminToken();
    const user = await register('grace@example.com', 'Grace');

    const adjusted = await request(app)
      .post('/v1/admin/trust/points/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: user.id, points: 75, note: 'Goodwill after a support failure' });
    expect(adjusted.status).toBe(201);
    expect(adjusted.body.data.status).toBe('cleared');

    const summary = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${user.token}`);
    expect(summary.body.data.balance).toBe(75);

    const reversed = await request(app)
      .post(`/v1/admin/trust/points/${adjusted.body.data.id}/reverse`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Issued in error' });
    expect(reversed.status).toBe(200);
    expect(reversed.body.data.status).toBe('reversed');

    const after = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${user.token}`);
    expect(after.body.data.balance).toBe(0);
  });
});
