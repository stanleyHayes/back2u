import { describe, expect, it } from 'vitest';

import { Reward } from '../../src/domain/reward/reward.entity.js';

const seed = () =>
  Reward.create({ id: 'r1', itemId: 'i1', amount: 5000, currency: 'GHS' });

describe('Reward', () => {
  it('defaults pointsBonus to amount/5', () => {
    expect(seed().snapshot.pointsBonus).toBe(1000);
  });
  it('hold transitions pending → held', () => {
    const r = seed();
    r.hold();
    expect(r.snapshot.status).toBe('held');
  });
  it('release sets finder + status', () => {
    const r = seed();
    r.hold();
    r.release('u9');
    expect(r.snapshot.finderId).toBe('u9');
    expect(r.snapshot.status).toBe('released');
    expect(r.snapshot.releasedAt).toBeInstanceOf(Date);
  });
  it('release twice throws', () => {
    const r = seed();
    r.hold();
    r.release('u9');
    expect(() => r.release('u9')).toThrow();
  });
});
