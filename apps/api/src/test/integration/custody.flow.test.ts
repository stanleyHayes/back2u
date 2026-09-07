import 'reflect-metadata';
import '../helpers/test-env.js';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestContainer } from '../test-container.js';
import { buildApp } from '../../interfaces/http/app.js';
import { getAuthToken } from '../auth-helper.js';
import { startTestMongo, stopTestMongo, clearTestMongo, ensureTestIndexes } from '../test-db.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type {
  ICustodyRecordRepository,
  IPartnerStaffRepository,
  IRecoveryCaseRepository,
  IRecoveryEventRepository,
} from '../../application/ports/custody-repos.js';
import type {
  IInstitutionRepository,
  IUserRepository,
} from '../../application/ports/repositories.js';
import type { ITokenService } from '../../application/ports/services.js';
import { Institution } from '../../domain/institution/institution.entity.js';
import { User } from '../../domain/user/user.entity.js';
import { OwnershipVerification } from '../../domain/verification/verification.entity.js';
import type { IVerificationRepository } from '../../application/ports/repositories.js';
import { newId } from '../../domain/shared/id.js';

const place = {
  name: 'KNUST Junction',
  point: { type: 'Point' as const, coordinates: [-1.567, 6.673] as [number, number] },
};

describe('Recovery Point custody flow (integration)', () => {
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

  /**
   * Seeds a user directly. The registration endpoint is behind a 10-per-5-minute
   * limiter, and this suite needs more accounts than that; going through the
   * repository also keeps each test independent of auth-flow behaviour.
   */
  const register = async (email: string, name: string) => {
    const users = container.get<IUserRepository>(TOKENS.UserRepository);
    const user = User.create({ id: newId(), email, name, passwordHash: 'x' });
    await users.save(user);
    return { token: getAuthToken(container, user.id, ['user'], email), id: user.id };
  };

  const partnerToken = (userId: string, institutionId: string, email: string): string =>
    container
      .get<ITokenService>(TOKENS.TokenService)
      .signAccess({ sub: userId, roles: ['partner_admin'], email, institutionId }).token;

  /** Onboards a custody-capable partner directly through the repository. */
  const seedInstitution = async (
    tier: Parameters<Institution['setTier']>[0] = 'recovery_point',
  ): Promise<string> => {
    const institutions = container.get<IInstitutionRepository>(TOKENS.InstitutionRepository);
    const institution = Institution.onboard({
      id: newId(),
      name: 'Tech Junction Pharmacy',
      type: 'pharmacy',
      contactEmail: 'desk@pharmacy.example',
      place,
      pointsRedeemable: false,
    });
    institution.setTier(tier);
    await institutions.save(institution);
    return institution.snapshot.id;
  };

  /** Posts a found item and returns its id. */
  const postFoundItem = async (token: string, title = 'Blue Samsung phone') => {
    const res = await request(app)
      .post('/v1/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kind: 'found',
        classification: 'lost',
        title,
        description: 'Cracked screen protector, blue case',
        category: 'Phone',
        images: [{ url: 'https://example.com/p.jpg', publicId: 'p1' }],
        place,
        occurredAt: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  /** Approves ownership for a claimant so a release can be authorised. */
  const approveOwnership = async (itemId: string, claimantId: string) => {
    const repo = container.get<IVerificationRepository>(TOKENS.VerificationRepository);
    const v = OwnershipVerification.submit({
      id: newId(),
      itemId,
      claimantId,
      answers: [],
      proofs: [],
      aiConsistencyScore: 0.95,
    });
    await repo.save(v);
  };

  it('opens a recovery case with a FOUND_REPORTED event for every found item (§9)', async () => {
    const finder = await register('finder@example.com', 'Finder');
    const itemId = await postFoundItem(finder.token);

    const cases = container.get<IRecoveryCaseRepository>(TOKENS.RecoveryCaseRepository);
    const recoveryCase = await cases.findByFoundItemId(itemId);
    expect(recoveryCase).not.toBeNull();
    expect(recoveryCase!.status).toBe('found');
    expect(recoveryCase!.snapshot.reference).toMatch(/^BAK-[A-Z2-9]{8}$/);

    const events = container.get<IRecoveryEventRepository>(TOKENS.RecoveryEventRepository);
    const history = await events.listForCase(recoveryCase!.id);
    expect(history).toHaveLength(1);
    expect(history[0]!.kind).toBe('FOUND_REPORTED');
    expect(history[0]!.sequence).toBe(1);
  });

  it('runs deposit → release with a one-time code, and records the whole chain', async () => {
    const institutionId = await seedInstitution();
    const finder = await register('kwame@example.com', 'Kwame');
    const owner = await register('ama@example.com', 'Ama');
    const clerk = await register('clerk@pharmacy.example', 'Clerk');
    const token = partnerToken(clerk.id, institutionId, 'clerk@pharmacy.example');

    const staff = container.get<IPartnerStaffRepository>(TOKENS.PartnerStaffRepository);
    const itemId = await postFoundItem(finder.token);

    // The partner sets up a counter and enrols the clerk.
    const location = await request(app)
      .post('/v1/custody/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Front desk', place, storageDescription: 'Locked cabinet behind the till' });
    expect(location.status).toBe(201);
    const locationId = location.body.data.id as string;

    const added = await request(app)
      .post('/v1/custody/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: clerk.id, role: 'supervisor' });
    expect(added.status).toBe(201);
    expect(await staff.findMembership(clerk.id, institutionId)).not.toBeNull();

    // Intake.
    const receipt = await request(app)
      .post('/v1/custody/custody')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId,
        locationId,
        depositedByUserId: finder.id,
        condition: 'good',
        declaredContents: ['phone', 'blue case'],
        storageBin: 'A-04',
        intakePhotos: ['https://example.com/intake.jpg'],
      });
    expect(receipt.status).toBe(201);
    expect(receipt.body.data.receiptCode).toMatch(/^[A-Z2-9]{8}$/);
    expect(receipt.body.data.sealId).toMatch(/^SEAL-[A-Z2-9]{10}$/);
    const custodyRecordId = receipt.body.data.custodyRecordId as string;
    const caseId = receipt.body.data.caseId as string;

    // The deposit itself earns the finder pending BakPoints (§3).
    const summary = await request(app)
      .get('/v1/points/summary')
      .set('Authorization', `Bearer ${finder.token}`);
    expect(summary.body.data.pending).toBeGreaterThan(0);
    expect(summary.body.data.balance).toBe(0);

    // Release needs a verified claimant.
    const tooEarly = await request(app)
      .post(`/v1/custody/custody/${custodyRecordId}/release-code`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimantId: owner.id });
    expect(tooEarly.status).toBe(403);

    await approveOwnership(itemId, owner.id);
    const issued = await request(app)
      .post(`/v1/custody/custody/${custodyRecordId}/release-code`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimantId: owner.id });
    expect(issued.status).toBe(200);
    expect(issued.body.data.issued).toBe(true);
    // The code is never echoed back to the counter.
    expect(JSON.stringify(issued.body)).not.toMatch(/\b\d{6}\b/);

    // A wrong code is refused and counted.
    const wrong = await request(app)
      .post(`/v1/custody/custody/${custodyRecordId}/release`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimantId: owner.id, releaseCode: '000000' });
    expect(wrong.status).toBe(403);

    const custody = container.get<ICustodyRecordRepository>(TOKENS.CustodyRecordRepository);
    expect((await custody.findById(custodyRecordId))!.snapshot.releaseAttempts).toBe(1);

    // Recover the real code from the claimant's notification and hand over.
    const notifications = await request(app)
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${owner.token}`);
    const codeNotice = (notifications.body.data as { body: string }[]).find((n) =>
      /collection code/i.test(n.body),
    );
    const code = /\b(\d{6})\b/.exec(codeNotice!.body)![1]!;

    const released = await request(app)
      .post(`/v1/custody/custody/${custodyRecordId}/release`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimantId: owner.id, releaseCode: code, note: 'ID checked at the desk' });
    expect(released.status).toBe(200);
    expect(released.body.data.status).toBe('released');
    expect(released.body.data.releasedToUserId).toBe(owner.id);

    // Replaying the same code cannot re-release the item.
    const replay = await request(app)
      .post(`/v1/custody/custody/${custodyRecordId}/release`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimantId: owner.id, releaseCode: code });
    expect(replay.status).toBe(409);

    // The chain of custody reads back in order for a participant.
    const chain = await request(app)
      .get(`/v1/recoveries/${caseId}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(chain.status).toBe(200);
    expect(chain.body.data.events.map((e: { kind: string }) => e.kind)).toEqual([
      'FOUND_REPORTED',
      'CUSTODY_ACCEPTED',
      'OWNERSHIP_VERIFIED',
      'ITEM_RELEASED',
    ]);
    expect(chain.body.data.events.map((e: { sequence: number }) => e.sequence)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(chain.body.data.status).toBe('released');
    expect(chain.body.data.verificationLevel).toBe('recovery_point');
  });

  it('keeps the chain of custody away from unrelated users', async () => {
    const finder = await register('f2@example.com', 'Finder');
    const stranger = await register('nosy@example.com', 'Nosy');
    const itemId = await postFoundItem(finder.token);

    const cases = container.get<IRecoveryCaseRepository>(TOKENS.RecoveryCaseRepository);
    const caseId = (await cases.findByFoundItemId(itemId))!.id;

    expect(
      (
        await request(app)
          .get(`/v1/recoveries/${caseId}`)
          .set('Authorization', `Bearer ${stranger.token}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get(`/v1/recoveries/${caseId}`)
          .set('Authorization', `Bearer ${finder.token}`)
      ).status,
    ).toBe(200);

    const adminTok = getAuthToken(container, newId(), ['admin'], 'admin@bak2me.com');
    expect(
      (
        await request(app)
          .get(`/v1/recoveries/${caseId}`)
          .set('Authorization', `Bearer ${adminTok}`)
      ).status,
    ).toBe(200);
  });

  it('refuses custody at a partner whose tier does not permit it (§11)', async () => {
    const institutionId = await seedInstitution('reward');
    const clerk = await register('clerk2@example.com', 'Clerk');
    const token = partnerToken(clerk.id, institutionId, 'clerk2@example.com');

    const res = await request(app)
      .post('/v1/custody/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Front desk', place });
    expect(res.status).toBe(403);
  });

  it('refuses custody at a suspended partner (§12)', async () => {
    const institutionId = await seedInstitution();
    const finder = await register('f3@example.com', 'Finder');
    const clerk = await register('clerk3@example.com', 'Clerk');
    const token = partnerToken(clerk.id, institutionId, 'clerk3@example.com');
    const itemId = await postFoundItem(finder.token);

    const location = await request(app)
      .post('/v1/custody/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Front desk', place });
    const locationId = location.body.data.id as string;
    await request(app)
      .post('/v1/custody/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: clerk.id, role: 'agent' })
      .expect(201);

    const adminTok = getAuthToken(container, newId(), ['admin'], 'admin@bak2me.com');
    const suspended = await request(app)
      .patch(`/v1/admin/trust/partners/${institutionId}/standing`)
      .set('Authorization', `Bearer ${adminTok}`)
      .send({ trustStatus: 'suspended', note: 'Deposits never returned' });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.trustStatus).toBe('suspended');

    const res = await request(app)
      .post('/v1/custody/custody')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId, locationId, depositedByUserId: finder.id, condition: 'good' });
    expect(res.status).toBe(403);
  });

  it('refuses a clerk accepting custody of their own find (§12)', async () => {
    const institutionId = await seedInstitution();
    const clerk = await register('clerk4@example.com', 'Clerk');
    const token = partnerToken(clerk.id, institutionId, 'clerk4@example.com');
    const itemId = await postFoundItem(clerk.token);

    const location = await request(app)
      .post('/v1/custody/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Front desk', place });
    await request(app)
      .post('/v1/custody/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: clerk.id, role: 'manager' })
      .expect(201);

    const res = await request(app)
      .post('/v1/custody/custody')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId,
        locationId: location.body.data.id,
        depositedByUserId: clerk.id,
        condition: 'good',
      });
    expect(res.status).toBe(403);
  });

  it('refuses one partner acting on another partner’s custody', async () => {
    const [instA, instB] = await Promise.all([seedInstitution(), seedInstitution()]);
    const finder = await register('f5@example.com', 'Finder');
    const clerkA = await register('a@example.com', 'A');
    const clerkB = await register('b@example.com', 'B');
    const tokenA = partnerToken(clerkA.id, instA, 'a@example.com');
    const tokenB = partnerToken(clerkB.id, instB, 'b@example.com');
    const itemId = await postFoundItem(finder.token);

    const location = await request(app)
      .post('/v1/custody/locations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A desk', place });
    await request(app)
      .post('/v1/custody/staff')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ userId: clerkA.id, role: 'agent' })
      .expect(201);

    const receipt = await request(app)
      .post('/v1/custody/custody')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId,
        locationId: location.body.data.id,
        depositedByUserId: finder.id,
        condition: 'good',
      });
    expect(receipt.status).toBe(201);

    // B is legitimate staff at its own org, but this item is not theirs.
    await request(app)
      .post('/v1/custody/staff')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ userId: clerkB.id, role: 'manager' })
      .expect(201);

    const res = await request(app)
      .post(`/v1/custody/custody/${receipt.body.data.custodyRecordId}/release-code`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ claimantId: finder.id });
    expect(res.status).toBe(403);
  });

  it('refuses a release code issued to a different claimant', async () => {
    const institutionId = await seedInstitution();
    const finder = await register('f7@example.com', 'Finder');
    const owner = await register('owner7@example.com', 'Owner');
    const impostor = await register('impostor@example.com', 'Impostor');
    const clerk = await register('clerk7@example.com', 'Clerk');
    const token = partnerToken(clerk.id, institutionId, 'clerk7@example.com');
    const itemId = await postFoundItem(finder.token);

    const location = await request(app)
      .post('/v1/custody/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Front desk', place });
    await request(app)
      .post('/v1/custody/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: clerk.id, role: 'manager' })
      .expect(201);

    const receipt = await request(app)
      .post('/v1/custody/custody')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId,
        locationId: location.body.data.id,
        depositedByUserId: finder.id,
        condition: 'good',
      })
      .expect(201);
    const custodyRecordId = receipt.body.data.custodyRecordId as string;

    // Both people are verified owners of record; only one holds the live code.
    await approveOwnership(itemId, owner.id);
    await approveOwnership(itemId, impostor.id);
    await request(app)
      .post(`/v1/custody/custody/${custodyRecordId}/release-code`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimantId: owner.id })
      .expect(200);

    const notices = await request(app)
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${owner.token}`);
    const code = /\b(\d{6})\b/.exec(
      (notices.body.data as { body: string }[]).find((n) => /collection code/i.test(n.body))!.body,
    )![1]!;

    const res = await request(app)
      .post(`/v1/custody/custody/${custodyRecordId}/release`)
      .set('Authorization', `Bearer ${token}`)
      .send({ claimantId: impostor.id, releaseCode: code });
    expect(res.status).toBe(403);

    // The real claimant's attempt budget must be untouched.
    const custody = container.get<ICustodyRecordRepository>(TOKENS.CustodyRecordRepository);
    expect((await custody.findById(custodyRecordId))!.snapshot.releaseAttempts).toBe(0);
  });

  it('reports deposits-to-returns for the partner trust summary (§12)', async () => {
    const institutionId = await seedInstitution();
    const finder = await register('f6@example.com', 'Finder');
    const clerk = await register('clerk6@example.com', 'Clerk');
    const token = partnerToken(clerk.id, institutionId, 'clerk6@example.com');

    const location = await request(app)
      .post('/v1/custody/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Front desk', place });
    await request(app)
      .post('/v1/custody/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: clerk.id, role: 'manager' })
      .expect(201);

    for (const title of ['Wallet', 'Umbrella']) {
      const itemId = await postFoundItem(finder.token, title);
      await request(app)
        .post('/v1/custody/custody')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId,
          locationId: location.body.data.id,
          depositedByUserId: finder.id,
          condition: 'good',
        })
        .expect(201);
    }

    const trust = await request(app)
      .get('/v1/custody/trust')
      .set('Authorization', `Bearer ${token}`);
    expect(trust.status).toBe(200);
    expect(trust.body.data.deposits).toBe(2);
    expect(trust.body.data.releases).toBe(0);
    expect(trust.body.data.depositsToReturnsRatio).toBe(0);
    expect(trust.body.data.openCustody).toBe(2);
    expect(trust.body.data.tier).toBe('recovery_point');
  });
});
