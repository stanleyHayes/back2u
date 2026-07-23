import { describe, expect, it } from 'vitest';

import { User } from '../../src/domain/user/user.entity.js';

const seed = () =>
  User.create({
    id: 'u1',
    email: 'a@b.co',
    name: 'A',
    passwordHash: 'h',
  });

describe('User', () => {
  it('starts at 0 / 0 with no badges', () => {
    const u = seed().snapshot;
    expect(u.pointsBalance).toBe(0);
    expect(u.reputationScore).toBe(0);
    expect(u.badges).toEqual([]);
  });

  it('awardPoints increments balance and reputation', () => {
    const u = seed();
    u.awardPoints(5, 1);
    expect(u.snapshot.pointsBalance).toBe(5);
    expect(u.snapshot.reputationScore).toBe(1);
  });

  it('spendPoints throws when insufficient', () => {
    const u = seed();
    expect(() => u.spendPoints(1)).toThrow();
  });

  it('hero_finder badge at 5 returns, trusted_guardian at 25', () => {
    const u = seed();
    for (let i = 0; i < 5; i++) u.recordSuccessfulReturn();
    expect(u.snapshot.badges).toContain('hero_finder');
    for (let i = 0; i < 20; i++) u.recordSuccessfulReturn();
    expect(u.snapshot.badges).toContain('trusted_guardian');
  });

  it('promoteTrustedFinder adds role + badge once', () => {
    const u = seed();
    u.promoteTrustedFinder();
    u.promoteTrustedFinder();
    expect(u.snapshot.roles.filter((r) => r === 'trusted_finder')).toHaveLength(1);
    expect(u.snapshot.badges.filter((b) => b === 'trusted_finder')).toHaveLength(1);
  });

  it('addPushToken is idempotent; removePushToken removes', () => {
    const u = seed();
    u.addPushToken('t');
    u.addPushToken('t');
    expect(u.snapshot.pushTokens).toEqual(['t']);
    u.removePushToken('t');
    expect(u.snapshot.pushTokens).toEqual([]);
  });
});
