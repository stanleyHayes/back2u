import { describe, expect, it } from 'vitest';

import { computeAward, recoveryActionForCategory } from '../../src/domain/points/points-policy.js';
import type { AwardContext } from '../../src/domain/points/points-policy.js';
import { BusinessRules } from '../../src/domain/rules/business-rules.entity.js';

const NOW = new Date('2026-09-07T12:00:00Z');

const ctx = (over: Partial<AwardContext> = {}): AwardContext => ({
  action: 'recovery_ordinary',
  verificationLevel: 'recovery_point',
  priorPairCount: 0,
  recoveriesLast30d: 0,
  accountAgeDays: 90,
  earnedToday: 0,
  earnedThisWeek: 0,
  earnedThisMonth: 0,
  now: NOW,
  ...over,
});

const rules = () => BusinessRules.createDefault();

const reasonCodes = (r: { reasons: { code: string }[] }): string[] => r.reasons.map((x) => x.code);

describe('computeAward — verification levels (§5)', () => {
  it('pays a Recovery Point return at full rate', () => {
    const result = computeAward(ctx(), rules());
    expect(result.basePoints).toBe(25);
    expect(result.multiplier).toBe(1);
    expect(result.points).toBe(25);
  });

  it('halves a peer-only return', () => {
    const result = computeAward(ctx({ verificationLevel: 'peer' }), rules());
    expect(result.multiplier).toBe(0.5);
    expect(result.points).toBe(13);
  });

  it('pays an institutional return above the standard rate', () => {
    const result = computeAward(ctx({ verificationLevel: 'institutional' }), rules());
    expect(result.multiplier).toBe(1.25);
    expect(result.points).toBe(31);
  });
});

describe('computeAward — anti-gaming controls (§7)', () => {
  it('penalises repeat recoveries beyond the free count', () => {
    const first = computeAward(ctx({ priorPairCount: 1 }), rules());
    const repeat = computeAward(ctx({ priorPairCount: 2 }), rules());
    expect(first.points).toBe(25);
    expect(repeat.points).toBe(13);
    expect(reasonCodes(repeat)).toContain('repeat_pair_penalty');
  });

  it('applies diminishing returns to unusually frequent finders', () => {
    const result = computeAward(ctx({ recoveriesLast30d: 8 }), rules());
    expect(result.points).toBe(13);
    expect(reasonCodes(result)).toContain('diminishing_returns');
  });

  it('stacks the repeat-pair penalty with diminishing returns', () => {
    const result = computeAward(ctx({ priorPairCount: 5, recoveriesLast30d: 20 }), rules());
    expect(result.multiplier).toBe(0.25);
    expect(result.points).toBe(6);
  });

  it('caps an award at the remaining daily headroom', () => {
    const result = computeAward(ctx({ earnedToday: 110 }), rules());
    expect(result.points).toBe(10);
    expect(reasonCodes(result)).toContain('daily_cap');
  });

  it('awards nothing once a cap is exhausted', () => {
    const result = computeAward(ctx({ earnedToday: 120 }), rules());
    expect(result.points).toBe(0);
  });

  it('applies the tightest binding cap across all three windows', () => {
    const result = computeAward(ctx({ earnedThisWeek: 398, earnedThisMonth: 1199 }), rules());
    expect(result.points).toBe(1);
  });

  it('holds a new account’s points for longer', () => {
    const fresh = computeAward(ctx({ accountAgeDays: 1 }), rules());
    const established = computeAward(ctx(), rules());
    const days = (r: { pendingUntil: Date }): number =>
      Math.round((r.pendingUntil.getTime() - NOW.getTime()) / 86_400_000);
    expect(days(established)).toBe(7);
    expect(days(fresh)).toBe(14);
    expect(reasonCodes(fresh)).toContain('new_account_delay');
  });

  it('adds a risk hold on top of the standard period', () => {
    const result = computeAward(ctx({ extraHoldDays: 14 }), rules());
    const days = Math.round((result.pendingUntil.getTime() - NOW.getTime()) / 86_400_000);
    expect(days).toBe(21);
    expect(reasonCodes(result)).toContain('risk_hold');
  });
});

describe('computeAward — admin-editable economics (§18)', () => {
  it('honours a retuned points value', () => {
    const r = rules();
    r.update({ pointsPerAction: { recovery_ordinary: 60 } });
    expect(computeAward(ctx(), r).points).toBe(60);
  });

  it('adds a configured category bonus to the base', () => {
    const r = rules();
    r.update({ categoryBonus: { bicycle: 15 } });
    const result = computeAward(ctx({ category: 'bicycle' }), r);
    expect(result.basePoints).toBe(40);
    expect(reasonCodes(result)).toContain('category_bonus');
  });

  it('applies a campaign multiplier only inside its window', () => {
    const r = rules();
    r.update({
      campaignMultiplier: 2,
      campaignStartsAt: '2026-09-01T00:00:00.000Z',
      campaignEndsAt: '2026-09-30T00:00:00.000Z',
    });
    expect(computeAward(ctx(), r).points).toBe(50);
    expect(computeAward(ctx({ now: new Date('2026-10-05T00:00:00Z') }), r).points).toBe(25);
  });

  it('treats a zero cap as no cap', () => {
    const r = rules();
    r.update({ dailyPointCap: 0 });
    expect(computeAward(ctx({ earnedToday: 9999 }), r).points).toBe(25);
  });
});

describe('recoveryActionForCategory', () => {
  it.each([
    ['Phone', 'recovery_device'],
    ['laptops', 'recovery_device'],
    ['National ID', 'recovery_document'],
    ['passport', 'recovery_document'],
    ['umbrella', 'recovery_ordinary'],
    [undefined, 'recovery_ordinary'],
  ])('maps %s to %s', (category, expected) => {
    expect(recoveryActionForCategory(category)).toBe(expected);
  });
});
