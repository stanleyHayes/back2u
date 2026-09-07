import { describe, expect, it } from 'vitest';

import { RecoveryCase } from '../../src/domain/recovery/recovery-case.entity.js';
import { RecoveryEvent } from '../../src/domain/recovery/recovery-event.entity.js';

const open = () =>
  RecoveryCase.open({
    id: 'case1',
    reference: 'BAK-ABCD2345',
    foundItemId: 'found1',
    finderId: 'finder',
  });

const deposit = (c: RecoveryCase) =>
  c.acceptCustody({
    custodyRecordId: 'cust1',
    institutionId: 'inst1',
    locationId: 'loc1',
    verificationLevel: 'recovery_point',
  });

describe('RecoveryCase — lifecycle', () => {
  it('opens at found with the weakest verification level', () => {
    const s = open().snapshot;
    expect(s.status).toBe('found');
    expect(s.verificationLevel).toBe('peer');
    expect(s.lastSequence).toBe(0);
  });

  it('walks the full happy path', () => {
    const c = open();
    deposit(c);
    expect(c.status).toBe('deposited');
    expect(c.snapshot.verificationLevel).toBe('recovery_point');
    c.attachMatch('m1', 'lost1');
    expect(c.status).toBe('matched');
    c.submitClaim('owner');
    c.verifyOwnership('owner');
    c.release();
    c.confirmReturn();
    c.close();
    expect(c.status).toBe('closed');
    expect(c.snapshot.closedAt).toBeInstanceOf(Date);
    expect(c.isOpen).toBe(false);
  });

  it('refuses to move backwards', () => {
    const c = open();
    deposit(c);
    c.attachMatch('m1', 'lost1');
    expect(() => deposit(c)).toThrow(/back to deposited/i);
  });

  it('refuses to skip nothing but also refuses to repeat a rung', () => {
    const c = open();
    deposit(c);
    expect(() => deposit(c)).toThrow();
  });

  it('allows skipping ahead — a peer return never enters custody', () => {
    const c = open();
    c.attachMatch('m1', 'lost1');
    c.submitClaim('owner');
    c.verifyOwnership('owner');
    c.confirmReturn();
    expect(c.status).toBe('returned');
  });

  it('cancels from any open state and then refuses everything', () => {
    const c = open();
    deposit(c);
    c.cancel();
    expect(c.status).toBe('cancelled');
    expect(c.isOpen).toBe(false);
    expect(() => c.attachMatch('m1', 'lost1')).toThrow();
    expect(() => c.cancel()).toThrow(/already cancelled/i);
  });

  it('refuses to cancel a closed case', () => {
    const c = open();
    c.attachMatch('m1', 'lost1');
    c.submitClaim('o');
    c.verifyOwnership('o');
    c.release();
    c.confirmReturn();
    c.close();
    expect(() => c.cancel()).toThrow();
  });
});

describe('RecoveryCase — event sequencing', () => {
  it('issues gap-free ascending sequence numbers', () => {
    const c = open();
    expect([c.nextSequence(), c.nextSequence(), c.nextSequence()]).toEqual([1, 2, 3]);
    expect(c.snapshot.lastSequence).toBe(3);
  });
});

describe('RecoveryEvent', () => {
  it('is immutable — it exposes no mutators', () => {
    const e = RecoveryEvent.record({
      id: 'e1',
      caseId: 'case1',
      sequence: 1,
      kind: 'CUSTODY_ACCEPTED',
      evidence: { sealId: 'SEAL-1' },
    });
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(e));
    expect(methods.filter((m) => m.startsWith('set') || m.startsWith('update'))).toEqual([]);
    expect(e.kind).toBe('CUSTODY_ACCEPTED');
  });

  it('hands out a copy of its evidence', () => {
    const e = RecoveryEvent.record({
      id: 'e1',
      caseId: 'case1',
      sequence: 1,
      kind: 'FOUND_REPORTED',
      evidence: { photos: ['a.jpg'] },
    });
    const snap = e.snapshot;
    snap.evidence.injected = true;
    expect(e.snapshot.evidence).toEqual({ photos: ['a.jpg'] });
  });

  it('supersedes an earlier event rather than editing it (§9)', () => {
    const correction = RecoveryEvent.correction({
      id: 'e2',
      caseId: 'case1',
      sequence: 2,
      correctsEventId: 'e1',
      actorId: 'staff',
      note: 'Condition was recorded as good; it is fair',
    });
    expect(correction.kind).toBe('CORRECTION');
    expect(correction.snapshot.correctsEventId).toBe('e1');
  });
});
