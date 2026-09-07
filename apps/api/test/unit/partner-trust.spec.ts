import { describe, expect, it } from 'vitest';

import { Institution } from '../../src/domain/institution/institution.entity.js';
import { PartnerStaff } from '../../src/domain/custody/partner-staff.entity.js';

const institution = (tier?: Parameters<Institution['setTier']>[0]) => {
  const i = Institution.onboard({
    id: 'inst1',
    name: 'Accra Mall Lost Property',
    type: 'mall',
    contactEmail: 'lost@mall.example',
    place: { name: 'Accra Mall', point: { type: 'Point', coordinates: [-0.17, 5.62] } },
    pointsRedeemable: false,
  });
  if (tier) i.setTier(tier);
  return i;
};

describe('Institution — partner tiers (§11)', () => {
  it('treats a partner onboarded before tiers existed as community', () => {
    expect(institution().tier).toBe('community');
  });

  it('lets only custody-capable tiers hold property', () => {
    expect(institution('community').canHoldCustody).toBe(false);
    expect(institution('reward').canHoldCustody).toBe(false);
    expect(institution('sponsor').canHoldCustody).toBe(false);
    expect(institution('recovery_point').canHoldCustody).toBe(true);
    expect(institution('verified_recovery_point').canHoldCustody).toBe(true);
    expect(institution('institutional').canHoldCustody).toBe(true);
    expect(institution('government').canHoldCustody).toBe(true);
  });
});

describe('Institution — trust status progression (§12)', () => {
  it('defaults to active', () => {
    expect(institution('recovery_point').trustStatus).toBe('active');
  });

  it('escalates without needing an admin', () => {
    const i = institution('recovery_point');
    i.setTrustStatus('watchlist', { note: 'ratio anomaly' });
    expect(i.trustStatus).toBe('watchlist');
    i.setTrustStatus('reward_hold');
    i.setTrustStatus('suspended');
    expect(i.trustStatus).toBe('suspended');
  });

  it('refuses an automated de-escalation', () => {
    const i = institution('recovery_point');
    i.setTrustStatus('suspended');
    expect(() => i.setTrustStatus('active')).toThrow(/only an admin/i);
    expect(i.trustStatus).toBe('suspended');
  });

  it('lets an admin lift a hold', () => {
    const i = institution('recovery_point');
    i.setTrustStatus('reward_hold');
    i.setTrustStatus('active', { byAdmin: true, note: 'investigation closed' });
    expect(i.trustStatus).toBe('active');
    expect(i.snapshot.trustStatusNote).toBe('investigation closed');
  });

  it('is a no-op when the status is unchanged', () => {
    const i = institution('recovery_point');
    i.setTrustStatus('active');
    expect(i.trustStatus).toBe('active');
  });

  it('stops a suspended partner operating, and holds rewards on a hold', () => {
    const i = institution('recovery_point');
    expect(i.canOperateCustody).toBe(true);
    expect(i.rewardsAreHeld).toBe(false);

    i.setTrustStatus('reward_hold');
    // A hold stops the money, not the counter — items must still be returnable.
    expect(i.canOperateCustody).toBe(true);
    expect(i.rewardsAreHeld).toBe(true);

    i.setTrustStatus('suspended');
    expect(i.canOperateCustody).toBe(false);
    expect(i.rewardsAreHeld).toBe(true);
  });
});

describe('PartnerStaff — membership scoping', () => {
  const staff = (over: Partial<Parameters<typeof PartnerStaff.add>[0]> = {}) =>
    PartnerStaff.add({
      id: 's1',
      userId: 'u1',
      institutionId: 'inst1',
      role: 'agent',
      ...over,
    });

  it('lets an unscoped member act at any location', () => {
    const s = staff();
    expect(s.canActAt('loc1')).toBe(true);
    expect(s.canActAt('loc2')).toBe(true);
  });

  it('confines a location-scoped member to that counter', () => {
    const s = staff({ locationId: 'loc1' });
    expect(s.canActAt('loc1')).toBe(true);
    expect(s.canActAt('loc2')).toBe(false);
  });

  it('lets nobody act once deactivated', () => {
    const s = staff();
    s.deactivate();
    expect(s.canActAt('loc1')).toBe(false);
    expect(s.canApprove).toBe(false);
  });

  it('reserves approval for supervisors and managers (maker-checker)', () => {
    expect(staff({ role: 'agent' }).canApprove).toBe(false);
    expect(staff({ role: 'supervisor' }).canApprove).toBe(true);
    expect(staff({ role: 'manager' }).canApprove).toBe(true);
  });

  it('follows a role change', () => {
    const s = staff({ role: 'agent' });
    s.changeRole('manager');
    expect(s.canApprove).toBe(true);
  });
});
