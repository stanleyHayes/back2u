import { describe, expect, it } from 'vitest';

import {
  BusinessRules,
  DEFAULT_BUSINESS_RULES,
} from '../../src/domain/rules/business-rules.entity.js';

describe('BusinessRules', () => {
  it('seeds the specification defaults', () => {
    const s = BusinessRules.createDefault().snapshot;
    expect(s.pointsPerAction.recovery_device).toBe(40);
    expect(s.pointsPendingDays).toBe(7);
    expect(s.verificationMultipliers.peer).toBe(0.5);
    expect(s.riskThresholds).toEqual({ mediumFrom: 31, highFrom: 61, criticalFrom: 81 });
  });

  it('merges a partial points update over the existing values', () => {
    const r = BusinessRules.createDefault();
    r.update({ pointsPerAction: { recovery_ordinary: 40 } });
    const s = r.snapshot;
    expect(s.pointsPerAction.recovery_ordinary).toBe(40);
    expect(s.pointsPerAction.recovery_device).toBe(40);
    expect(s.pointsPerAction.found_item_reported).toBe(5);
  });

  it('records who changed it and when', () => {
    const r = BusinessRules.createDefault();
    const before = r.snapshot.updatedAt;
    r.update({ pointsPendingDays: 14 }, 'admin-1');
    expect(r.snapshot.updatedBy).toBe('admin-1');
    expect(r.snapshot.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('rejects out-of-range values', () => {
    const r = BusinessRules.createDefault();
    expect(() => r.update({ repeatPairPenalty: 1.5 })).toThrow();
    expect(() => r.update({ rewardPlatformFeeRate: -0.1 })).toThrow();
    expect(() => r.update({ pointsPendingDays: 999 })).toThrow();
    expect(() => r.update({ verificationMultipliers: { peer: 99 } })).toThrow();
  });

  it('rejects risk thresholds that do not increase', () => {
    const r = BusinessRules.createDefault();
    expect(() => r.update({ riskThresholds: { highFrom: 20 } })).toThrow();
    expect(() =>
      r.update({ riskThresholds: { mediumFrom: 10, highFrom: 20, criticalFrom: 15 } }),
    ).toThrow();
  });

  it('rejects a campaign window that ends before it starts', () => {
    const r = BusinessRules.createDefault();
    expect(() =>
      r.update({
        campaignStartsAt: '2026-10-01T00:00:00.000Z',
        campaignEndsAt: '2026-09-01T00:00:00.000Z',
      }),
    ).toThrow();
  });

  it('leaves the stored rules untouched when an update is rejected', () => {
    const r = BusinessRules.createDefault();
    expect(() => r.update({ pointsPendingDays: 10, repeatPairPenalty: 5 })).toThrow();
    expect(r.snapshot.pointsPendingDays).toBe(7);
  });

  it('backfills knobs missing from an older stored document', () => {
    const { campaignMultiplier: _omitted, ...partial } = DEFAULT_BUSINESS_RULES;
    const r = BusinessRules.rehydrate({
      ...(partial as Parameters<typeof BusinessRules.rehydrate>[0]),
      updatedAt: new Date(),
    });
    expect(r.snapshot.campaignMultiplier).toBe(1);
  });

  it('applies the campaign multiplier only inside its window', () => {
    const r = BusinessRules.createDefault();
    r.update({
      campaignMultiplier: 3,
      campaignStartsAt: '2026-09-01T00:00:00.000Z',
      campaignEndsAt: '2026-09-30T00:00:00.000Z',
    });
    expect(r.campaignMultiplierAt(new Date('2026-09-15T00:00:00Z'))).toBe(3);
    expect(r.campaignMultiplierAt(new Date('2026-08-15T00:00:00Z'))).toBe(1);
    expect(r.campaignMultiplierAt(new Date('2026-10-15T00:00:00Z'))).toBe(1);
  });

  it('falls back to the peer multiplier for an unknown level', () => {
    const r = BusinessRules.createDefault();
    expect(r.multiplierFor('recovery_point')).toBe(1);
    expect(r.multiplierFor('institutional')).toBe(1.25);
  });
});
