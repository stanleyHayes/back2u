import { describe, expect, it } from 'vitest';

import { RewardOffer } from '../../src/domain/reward_catalog/reward-offer.entity.js';

const NOW = new Date('2026-09-20T12:00:00Z');

const create = (over: Partial<Parameters<typeof RewardOffer.create>[0]> = {}) =>
  RewardOffer.create({
    id: 'o1',
    institutionId: 'inst1',
    title: '1GB mobile data',
    description: 'Valid on MTN for 30 days',
    category: 'mobile_data',
    pointsCost: 50,
    ...over,
  });

describe('RewardOffer — creation', () => {
  it('starts as a draft so a partner can set it up before it is visible', () => {
    expect(create().snapshot.status).toBe('draft');
  });

  it('treats absent inventory as unlimited', () => {
    const o = create();
    expect(o.isUnlimited).toBe(true);
    expect(o.snapshot.remainingInventory).toBeUndefined();
  });

  it('seeds remaining inventory from the total', () => {
    const o = create({ totalInventory: 100 });
    expect(o.isUnlimited).toBe(false);
    expect(o.snapshot.remainingInventory).toBe(100);
  });

  it('rejects a nonsensical cost or inventory', () => {
    expect(() => create({ pointsCost: 0 })).toThrow();
    expect(() => create({ pointsCost: 1.5 })).toThrow();
    expect(() => create({ totalInventory: -1 })).toThrow();
    expect(() => create({ perUserLimit: 0 })).toThrow();
  });

  it('rejects a campaign that ends before it starts', () => {
    expect(() =>
      create({ startsAt: '2026-10-01T00:00:00.000Z', endsAt: '2026-09-01T00:00:00.000Z' }),
    ).toThrow(/before it ends/i);
  });

  it('defaults the reservation hold and bounds it', () => {
    expect(create().snapshot.reservationHours).toBe(72);
    expect(() => create({ reservationHours: 0 })).toThrow();
    expect(() => create({ reservationHours: 10_000 })).toThrow();
  });
});

describe('RewardOffer — availability', () => {
  const live = (over = {}) => {
    const o = create(over);
    o.update({ status: 'live' });
    return o;
  };

  it('is unavailable while still a draft or paused', () => {
    expect(create().availability(NOW)).toBe('not_live');
    const paused = live();
    paused.update({ status: 'paused' });
    expect(paused.availability(NOW)).toBe('not_live');
  });

  it('is available once live with no window', () => {
    expect(live().availability(NOW)).toBeNull();
  });

  it('respects the campaign window', () => {
    const future = live({ startsAt: '2026-10-01T00:00:00.000Z' });
    expect(future.availability(NOW)).toBe('not_started');
    const past = live({ endsAt: '2026-09-01T00:00:00.000Z' });
    expect(past.availability(NOW)).toBe('ended');
  });

  it('reports sold out when stock runs down', () => {
    const o = live({ totalInventory: 1 });
    expect(o.availability(NOW)).toBeNull();
    o.recordReservation();
    expect(o.availability(NOW)).toBe('sold_out');
  });

  it('never runs out when inventory is unlimited', () => {
    const o = live();
    for (let i = 0; i < 50; i++) o.recordReservation();
    expect(o.availability(NOW)).toBeNull();
  });
});

describe('RewardOffer — trust eligibility (§16 tie-in)', () => {
  it('admits everyone when no minimum is set', () => {
    expect(create().allowsTrustLevel('new_finder')).toBe(true);
  });

  it('admits only members at or above the bar', () => {
    const o = create({ minTrustLevel: 'trusted_finder' });
    expect(o.allowsTrustLevel('new_finder')).toBe(false);
    expect(o.allowsTrustLevel('helper')).toBe(false);
    expect(o.allowsTrustLevel('trusted_finder')).toBe(true);
    expect(o.allowsTrustLevel('guardian')).toBe(true);
    expect(o.allowsTrustLevel('legend')).toBe(true);
  });
});

describe('RewardOffer — inventory changes', () => {
  it('releases exactly the stock added rather than resetting claims', () => {
    const o = create({ totalInventory: 10 });
    o.recordReservation();
    o.recordReservation();
    expect(o.snapshot.remainingInventory).toBe(8);

    o.update({ totalInventory: 20 });
    expect(o.snapshot.totalInventory).toBe(20);
    // 2 already claimed, so 18 left — not a reset to 20.
    expect(o.snapshot.remainingInventory).toBe(18);
  });

  it('refuses to cut inventory below what is already claimed', () => {
    const o = create({ totalInventory: 10 });
    for (let i = 0; i < 6; i++) o.recordReservation();
    expect(() => o.update({ totalInventory: 3 })).toThrow(/already claimed/i);
  });

  it('can be switched to unlimited', () => {
    const o = create({ totalInventory: 5 });
    o.update({ totalInventory: null });
    expect(o.isUnlimited).toBe(true);
  });

  it('never restores stock above the declared total', () => {
    const o = create({ totalInventory: 2 });
    o.recordReservation();
    o.restoreInventory();
    o.restoreInventory();
    expect(o.snapshot.remainingInventory).toBe(2);
  });

  it('never drives stock below zero', () => {
    const o = create({ totalInventory: 1 });
    o.recordReservation();
    o.recordReservation();
    expect(o.snapshot.remainingInventory).toBe(0);
  });
});

describe('RewardOffer — lifecycle', () => {
  it('refuses to reopen an ended campaign', () => {
    const o = create();
    o.update({ status: 'ended' });
    expect(() => o.update({ status: 'live' })).toThrow(/cannot be reopened/i);
  });

  it('computes the reservation expiry from its hold', () => {
    const o = create({ reservationHours: 24 });
    expect(o.reservationExpiry(NOW).getTime()).toBe(NOW.getTime() + 24 * 3_600_000);
  });
});
