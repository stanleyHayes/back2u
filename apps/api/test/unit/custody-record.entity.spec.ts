import { beforeAll, describe, expect, it } from 'vitest';

import {
  CustodyRecord,
  MAX_RELEASE_ATTEMPTS,
  RELEASE_CODE_TTL_MS,
} from '../../src/domain/custody/custody-record.entity.js';

// The release-code hash is peppered with this secret.
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET ??= 'test-secret-that-is-long-enough';
});

const accept = (over: Partial<Parameters<typeof CustodyRecord.accept>[0]> = {}) =>
  CustodyRecord.accept({
    id: 'c1',
    caseId: 'case1',
    itemId: 'item1',
    institutionId: 'inst1',
    locationId: 'loc1',
    depositedByUserId: 'finder',
    acceptedByStaffId: 'staff',
    condition: 'good',
    sealId: 'SEAL-ABC',
    receiptCode: 'RCPT1234',
    ...over,
  });

describe('CustodyRecord — intake', () => {
  it('starts held with the intake evidence recorded', () => {
    const r = accept({ declaredContents: ['keys', 'ID card'], storageBin: 'A-12' });
    const s = r.snapshot;
    expect(s.status).toBe('held');
    expect(s.declaredContents).toEqual(['keys', 'ID card']);
    expect(s.storageBin).toBe('A-12');
    expect(s.releaseAttempts).toBe(0);
  });

  it('refuses a staff member accepting custody of their own find (§12)', () => {
    expect(() => accept({ depositedByUserId: 'same', acceptedByStaffId: 'same' })).toThrow(
      /own deposit/i,
    );
  });

  it('hands out copies of its arrays', () => {
    const r = accept({ declaredContents: ['keys'] });
    r.snapshot.declaredContents.push('injected');
    expect(r.snapshot.declaredContents).toEqual(['keys']);
  });
});

describe('CustodyRecord — release code', () => {
  it('never stores the code in the clear', () => {
    const r = accept();
    r.issueReleaseCode('123456', 'owner');
    const s = r.snapshot;
    expect(s.releaseCodeHash).toBeTruthy();
    expect(s.releaseCodeHash).not.toBe('123456');
    expect(JSON.stringify(s)).not.toContain('123456');
  });

  it('sets an expiry when issued', () => {
    const now = new Date('2026-09-07T12:00:00Z');
    const r = accept();
    r.issueReleaseCode('123456', 'owner', now);
    expect(r.snapshot.releaseCodeExpiresAt!.getTime()).toBe(now.getTime() + RELEASE_CODE_TTL_MS);
  });

  it('resets the attempt counter on reissue', () => {
    const r = accept();
    r.issueReleaseCode('111111', 'owner');
    expect(() =>
      r.release({ code: 'wrong', claimantId: 'owner', releasedByStaffId: 'staff' }),
    ).toThrow();
    expect(r.snapshot.releaseAttempts).toBe(1);
    r.issueReleaseCode('222222', 'owner');
    expect(r.snapshot.releaseAttempts).toBe(0);
  });
});

describe('CustodyRecord — release', () => {
  const released = () => {
    const r = accept();
    r.issueReleaseCode('123456', 'owner');
    r.release({ code: '123456', claimantId: 'owner', releasedByStaffId: 'staff' });
    return r;
  };

  it('hands over on the right code and records who and when', () => {
    const r = released();
    const s = r.snapshot;
    expect(s.status).toBe('released');
    expect(s.releasedToUserId).toBe('owner');
    expect(s.releasedByStaffId).toBe('staff');
    expect(s.releasedAt).toBeInstanceOf(Date);
  });

  it('burns the code so a replay cannot re-release the item', () => {
    const r = released();
    expect(r.snapshot.releaseCodeHash).toBeUndefined();
    expect(() =>
      r.release({ code: '123456', claimantId: 'owner', releasedByStaffId: 'staff' }),
    ).toThrow(/not in custody/i);
  });

  it('rejects a wrong code and counts the attempt', () => {
    const r = accept();
    r.issueReleaseCode('123456', 'owner');
    expect(() =>
      r.release({ code: '000000', claimantId: 'owner', releasedByStaffId: 'staff' }),
    ).toThrow(/invalid release code/i);
    expect(r.snapshot.releaseAttempts).toBe(1);
    expect(r.snapshot.status).toBe('held');
  });

  it('burns the code after too many wrong guesses', () => {
    const r = accept();
    r.issueReleaseCode('123456', 'owner');
    for (let i = 0; i < MAX_RELEASE_ATTEMPTS; i++) {
      expect(() =>
        r.release({ code: '000000', claimantId: 'owner', releasedByStaffId: 'staff' }),
      ).toThrow();
    }
    // Even the correct code no longer works once the budget is spent.
    expect(() =>
      r.release({ code: '123456', claimantId: 'owner', releasedByStaffId: 'staff' }),
    ).toThrow(/too many failed/i);
    expect(r.snapshot.status).toBe('held');
  });

  it('rejects an expired code', () => {
    const now = new Date('2026-09-07T12:00:00Z');
    const r = accept();
    r.issueReleaseCode('123456', 'owner', now);
    expect(() =>
      r.release({
        code: '123456',
        claimantId: 'owner',
        releasedByStaffId: 'staff',
        now: new Date(now.getTime() + RELEASE_CODE_TTL_MS + 1000),
      }),
    ).toThrow(/expired/i);
  });

  it('refuses to release before any code was issued', () => {
    expect(() =>
      accept().release({ code: '123456', claimantId: 'owner', releasedByStaffId: 'staff' }),
    ).toThrow(/no release code/i);
  });

  it('refuses a staff member releasing to themselves (§12)', () => {
    const r = accept();
    r.issueReleaseCode('123456', 'staff');
    expect(() =>
      r.release({ code: '123456', claimantId: 'staff', releasedByStaffId: 'staff' }),
    ).toThrow(/to themselves/i);
    expect(r.snapshot.status).toBe('held');
  });

  it('refuses a code issued to a different claimant', () => {
    const r = accept();
    r.issueReleaseCode('123456', 'owner');
    expect(() =>
      r.release({ code: '123456', claimantId: 'someone-else', releasedByStaffId: 'staff' }),
    ).toThrow(/different claimant/i);
    expect(r.snapshot.status).toBe('held');
    // A stranger presenting the code must not burn the real claimant's budget.
    expect(r.snapshot.releaseAttempts).toBe(0);
  });

  it('never stores the claimant binding in a way that survives the handover', () => {
    const r = accept();
    r.issueReleaseCode('123456', 'owner');
    r.release({ code: '123456', claimantId: 'owner', releasedByStaffId: 'staff' });
    expect(r.snapshot.releaseCodeClaimantId).toBeUndefined();
  });
});

describe('CustodyRecord — transfer and storage', () => {
  it('moves to another location and clears the stale bin', () => {
    const r = accept({ storageBin: 'A-1' });
    r.transferTo('loc2');
    expect(r.snapshot.locationId).toBe('loc2');
    expect(r.snapshot.storageBin).toBeUndefined();
  });

  it('refuses a transfer to the same location', () => {
    expect(() => accept().transferTo('loc1')).toThrow();
  });

  it('refuses to transfer or re-bin an item already released', () => {
    const r = accept();
    r.issueReleaseCode('123456', 'owner');
    r.release({ code: '123456', claimantId: 'owner', releasedByStaffId: 'staff' });
    expect(() => r.transferTo('loc2')).toThrow();
    expect(() => r.updateStorageBin('B-2')).toThrow();
    expect(() => r.issueReleaseCode('999999', 'owner')).toThrow();
  });
});
