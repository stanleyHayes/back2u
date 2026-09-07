import { describe, expect, it } from 'vitest';

import {
  computeTrustScore,
  levelFor,
  type TrustSignals,
} from '../../src/domain/trust/trust-score.js';

const base = (over: Partial<TrustSignals> = {}): TrustSignals => ({
  emailVerified: true,
  phoneVerified: true,
  mfaEnabled: false,
  status: 'active',
  accountAgeDays: 365,
  verifiedRecoveries: 0,
  strongEvidenceRecoveries: 0,
  distinctCounterparties: 0,
  reviewCount: 0,
  confirmedFraudCount: 0,
  reversalCount: 0,
  ...over,
});

const scoreOf = (over: Partial<TrustSignals> = {}) => computeTrustScore(base(over)).score;
const component = (over: Partial<TrustSignals>, key: string) =>
  computeTrustScore(base(over)).components.find((c) => c.key === key)!;

describe('computeTrustScore — trust cannot be bought with volume (§16)', () => {
  it('stops rewarding raw volume once history saturates', () => {
    const at20 = component({ verifiedRecoveries: 20 }, 'recovery_history').value;
    const at100 = component({ verifiedRecoveries: 100 }, 'recovery_history').value;
    const at1000 = component({ verifiedRecoveries: 1000 }, 'recovery_history').value;
    expect(at20).toBe(1);
    expect(at100).toBe(1);
    expect(at1000).toBe(1);
  });

  it('scores a hundred unwitnessed recoveries no better on quality than one', () => {
    const one = component(
      { verifiedRecoveries: 1, strongEvidenceRecoveries: 0 },
      'verification_quality',
    );
    const many = component(
      { verifiedRecoveries: 100, strongEvidenceRecoveries: 0 },
      'verification_quality',
    );
    expect(one.value).toBe(0);
    expect(many.value).toBe(0);
  });

  it('ranks evidence quality over sheer count', () => {
    // Ten recoveries, every one witnessed by a partner.
    const careful = scoreOf({
      verifiedRecoveries: 10,
      strongEvidenceRecoveries: 10,
      distinctCounterparties: 10,
    });
    // Forty recoveries, none with any independent evidence.
    const prolific = scoreOf({
      verifiedRecoveries: 40,
      strongEvidenceRecoveries: 0,
      distinctCounterparties: 40,
    });
    expect(careful).toBeGreaterThan(prolific);
  });

  it('does not let one pair farming each other build community standing', () => {
    const farmed = component(
      { verifiedRecoveries: 50, distinctCounterparties: 1 },
      'community_history',
    ).value;
    const genuine = component(
      { verifiedRecoveries: 50, distinctCounterparties: 20 },
      'community_history',
    ).value;
    expect(genuine).toBeGreaterThan(farmed * 2);
  });
});

describe('computeTrustScore — components', () => {
  it('rewards identity verification', () => {
    expect(
      component({ emailVerified: false, phoneVerified: false }, 'identity_confidence').value,
    ).toBe(0);
    expect(
      component(
        { emailVerified: true, phoneVerified: true, mfaEnabled: true },
        'identity_confidence',
      ).value,
    ).toBe(1);
  });

  it('zeroes integrity for a suspended account', () => {
    expect(component({ status: 'suspended' }, 'account_integrity').value).toBe(0);
    expect(component({ status: 'banned' }, 'account_integrity').value).toBe(0);
  });

  it('drops integrity sharply on confirmed fraud', () => {
    expect(component({ confirmedFraudCount: 1 }, 'account_integrity').value).toBeCloseTo(0.5);
    expect(component({ confirmedFraudCount: 2 }, 'account_integrity').value).toBe(0);
  });

  it('erodes integrity with reversals', () => {
    expect(component({ reversalCount: 3 }, 'account_integrity').value).toBeCloseTo(0.7);
  });

  it('treats a brand-new account as unproven rather than untrustworthy', () => {
    const fresh = component({ accountAgeDays: 3 }, 'account_integrity');
    const settled = component({ accountAgeDays: 90 }, 'account_integrity');
    expect(fresh.value).toBeCloseTo(0.1);
    expect(settled.value).toBe(1);
    expect(fresh.detail).toMatch(/3 days old/);
  });

  it('falls when a good record is followed by fraud', () => {
    const clean = scoreOf({
      verifiedRecoveries: 20,
      strongEvidenceRecoveries: 20,
      distinctCounterparties: 15,
    });
    const after = scoreOf({
      verifiedRecoveries: 20,
      strongEvidenceRecoveries: 20,
      distinctCounterparties: 15,
      confirmedFraudCount: 1,
    });
    expect(after).toBeLessThan(clean);
  });
});

describe('computeTrustScore — partner integrity', () => {
  it('omits the component entirely for someone who is not staff', () => {
    expect(computeTrustScore(base()).components.map((c) => c.key)).not.toContain(
      'partner_integrity',
    );
  });

  it('does not penalise a non-staff account for the missing signal', () => {
    const consumer = scoreOf({
      verifiedRecoveries: 10,
      strongEvidenceRecoveries: 10,
      distinctCounterparties: 10,
    });
    const staff = computeTrustScore(
      base({
        verifiedRecoveries: 10,
        strongEvidenceRecoveries: 10,
        distinctCounterparties: 10,
        partner: { depositsToReturnsRatio: 1, custodyDisputes: 0 },
      }),
    ).score;
    // A perfect partner record should not score below a consumer's.
    expect(staff).toBeGreaterThanOrEqual(consumer - 1);
  });

  it('treats a counter with no activity as neutral', () => {
    const c = computeTrustScore(
      base({ partner: { depositsToReturnsRatio: null, custodyDisputes: 0 } }),
    ).components.find((x) => x.key === 'partner_integrity')!;
    expect(c.value).toBe(0.5);
    expect(c.detail).toMatch(/no custody activity/i);
  });

  it('penalises a partner that takes deposits but rarely returns them', () => {
    const good = computeTrustScore(
      base({ partner: { depositsToReturnsRatio: 0.9, custodyDisputes: 0 } }),
    ).components.find((x) => x.key === 'partner_integrity')!.value;
    const bad = computeTrustScore(
      base({ partner: { depositsToReturnsRatio: 0.1, custodyDisputes: 2 } }),
    ).components.find((x) => x.key === 'partner_integrity')!.value;
    expect(good).toBeGreaterThan(bad);
  });
});

describe('levelFor — dual gates', () => {
  it('starts everyone at New Finder', () => {
    expect(levelFor(0, 0)).toBe('new_finder');
    expect(computeTrustScore(base()).level).toBe('new_finder');
  });

  it('refuses to promote a high score with no track record', () => {
    // A verified, clean, brand-new account can score well but has proved nothing.
    expect(levelFor(95, 0)).toBe('new_finder');
    expect(levelFor(95, 3)).toBe('helper');
    expect(levelFor(95, 10)).toBe('trusted_finder');
  });

  it('refuses to promote a long track record with a poor score', () => {
    expect(levelFor(20, 500)).toBe('new_finder');
    expect(levelFor(45, 500)).toBe('helper');
  });

  it('climbs when both gates are met', () => {
    expect(levelFor(50, 5)).toBe('trusted_finder');
    expect(levelFor(65, 15)).toBe('community_hero');
    expect(levelFor(80, 30)).toBe('guardian');
    expect(levelFor(90, 60)).toBe('legend');
  });

  it('tells the user exactly what is still missing', () => {
    const r = computeTrustScore(
      base({ verifiedRecoveries: 2, strongEvidenceRecoveries: 2, distinctCounterparties: 2 }),
    );
    expect(r.nextLevel).toBeDefined();
    expect(r.nextLevelRequirement).toMatch(/more verified recoveries|Trust Score/);
  });
});
