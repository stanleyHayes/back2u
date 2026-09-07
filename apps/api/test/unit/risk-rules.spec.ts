import { describe, expect, it } from 'vitest';

import type { RecoveryRiskSignals } from '../../src/domain/risk/risk-rules.js';
import { actionFor, bandFor, evaluateRecoveryRisk } from '../../src/domain/risk/risk-rules.js';
import { BusinessRules } from '../../src/domain/rules/business-rules.entity.js';

/** A clean, unremarkable recovery: nothing should fire. */
const clean = (over: Partial<RecoveryRiskSignals> = {}): RecoveryRiskSignals => ({
  ownerId: 'owner',
  finderId: 'finder',
  priorPairCount: 0,
  reciprocalCount: 0,
  sharedDevice: false,
  sharedPayoutAccount: false,
  youngestAccountAgeDays: 200,
  hoursBetweenReports: 48,
  highValueRecoveriesLast30d: 0,
  duplicateMedia: false,
  partnerConcentration: 0,
  disputeCount: 0,
  peerOnlyReturn: false,
  ...over,
});

const rules = () => BusinessRules.createDefault();
const codes = (signals: RecoveryRiskSignals): string[] =>
  evaluateRecoveryRisk(signals, rules()).ruleHits.map((h) => h.code);

describe('evaluateRecoveryRisk — clean recoveries', () => {
  it('scores an ordinary recovery as low risk and clears it', () => {
    const result = evaluateRecoveryRisk(clean(), rules());
    expect(result.score).toBe(0);
    expect(result.band).toBe('low');
    expect(result.action).toBe('clear');
    expect(result.ruleHits).toEqual([]);
  });

  it('does not penalise a first repeat inside the free count', () => {
    expect(codes(clean({ priorPairCount: 1 }))).not.toContain('repeat_pair');
  });
});

describe('evaluateRecoveryRisk — collusion signals (§6)', () => {
  it('flags a repeated owner/finder pairing', () => {
    expect(codes(clean({ priorPairCount: 3 }))).toContain('repeat_pair');
  });

  it('flags reciprocal recoveries', () => {
    expect(codes(clean({ reciprocalCount: 1 }))).toContain('reciprocal_recovery');
  });

  it('flags two accounts on one device', () => {
    expect(codes(clean({ sharedDevice: true }))).toContain('shared_device');
  });

  it('flags a shared payout destination', () => {
    expect(codes(clean({ sharedPayoutAccount: true }))).toContain('shared_payout');
  });

  it('flags an account created shortly before the recovery', () => {
    expect(codes(clean({ youngestAccountAgeDays: 2 }))).toContain('new_account');
  });

  it('flags an implausibly short gap between the loss and found reports', () => {
    expect(codes(clean({ hoursBetweenReports: 0.5 }))).toContain('fast_turnaround');
  });

  it('flags repeated high-value recoveries', () => {
    expect(codes(clean({ highValueRecoveriesLast30d: 6 }))).toContain('high_value_frequency');
  });

  it('flags reused images or descriptions', () => {
    expect(codes(clean({ duplicateMedia: true }))).toContain('duplicate_media');
  });

  it('flags reward farming concentrated through one partner', () => {
    expect(codes(clean({ partnerConcentration: 0.9 }))).toContain('partner_concentration');
  });

  it('flags a prior dispute or ownership failure', () => {
    expect(codes(clean({ disputeCount: 2 }))).toContain('dispute_history');
  });

  it('flags a high-value item returned on peer confirmation alone', () => {
    expect(codes(clean({ peerOnlyReturn: true, itemValueMinor: 250_000 }))).toContain(
      'peer_only_high_value',
    );
  });

  it('leaves a low-value peer return alone', () => {
    expect(codes(clean({ peerOnlyReturn: true, itemValueMinor: 5_000 }))).not.toContain(
      'peer_only_high_value',
    );
  });
});

describe('evaluateRecoveryRisk — banding and response (§6)', () => {
  it('escalates the classic collusion pattern to a freeze', () => {
    const result = evaluateRecoveryRisk(
      clean({
        sharedDevice: true,
        sharedPayoutAccount: true,
        priorPairCount: 4,
        reciprocalCount: 2,
      }),
      rules(),
    );
    expect(result.band).toBe('critical');
    expect(result.action).toBe('freeze');
  });

  it('routes a moderate signal to an extended hold', () => {
    const result = evaluateRecoveryRisk(clean({ youngestAccountAgeDays: 1 }), rules());
    expect(result.band).toBe('low');
    const escalated = evaluateRecoveryRisk(
      clean({ youngestAccountAgeDays: 1, hoursBetweenReports: 0.2, duplicateMedia: true }),
      rules(),
    );
    expect(escalated.band).toBe('medium');
    expect(escalated.action).toBe('extend_hold');
  });

  it('never exceeds 100', () => {
    const result = evaluateRecoveryRisk(
      clean({
        priorPairCount: 9,
        reciprocalCount: 9,
        sharedDevice: true,
        sharedPayoutAccount: true,
        youngestAccountAgeDays: 0,
        hoursBetweenReports: 0,
        highValueRecoveriesLast30d: 20,
        duplicateMedia: true,
        partnerConcentration: 1,
        disputeCount: 5,
        peerOnlyReturn: true,
        itemValueMinor: 900_000,
      }),
      rules(),
    );
    expect(result.score).toBe(100);
    expect(result.band).toBe('critical');
  });

  it('re-bands when an admin retunes the thresholds (§18)', () => {
    const r = rules();
    r.update({ riskThresholds: { mediumFrom: 5, highFrom: 10, criticalFrom: 15 } });
    const result = evaluateRecoveryRisk(clean({ hoursBetweenReports: 0.5 }), r);
    expect(result.band).toBe('high');
    expect(result.action).toBe('manual_review');
  });
});

describe('bandFor / actionFor', () => {
  const t = { mediumFrom: 31, highFrom: 61, criticalFrom: 81 };
  it.each([
    [0, 'low'],
    [30, 'low'],
    [31, 'medium'],
    [60, 'medium'],
    [61, 'high'],
    [80, 'high'],
    [81, 'critical'],
    [100, 'critical'],
  ])('scores %i as %s', (score, band) => {
    expect(bandFor(score, t)).toBe(band);
  });

  it.each([
    ['low', 'clear'],
    ['medium', 'extend_hold'],
    ['high', 'manual_review'],
    ['critical', 'freeze'],
  ] as const)('maps %s to %s', (band, action) => {
    expect(actionFor(band)).toBe(action);
  });
});
