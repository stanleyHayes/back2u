import { describe, expect, it } from 'vitest';

import { CourierJob } from '../../src/domain/courier/courier-job.entity.js';

const place = (name: string) => ({ name, point: { type: 'Point' as const, coordinates: [0, 0] as [number, number] } });
const seed = () =>
  CourierJob.request({
    id: 'j1',
    itemId: 'i1',
    pickup: place('A'),
    dropoff: place('B'),
    fee: 1000,
    currency: 'GHS',
    requesterId: 'u1',
    pickupCode: '111111',
    deliveryCode: '222222',
  });

describe('CourierJob', () => {
  it('only requested can be accepted', () => {
    const j = seed();
    j.acceptedBy('rider1');
    expect(j.snapshot.status).toBe('accepted');
    expect(() => j.acceptedBy('rider2')).toThrow();
  });

  it('pickup requires accepted + correct code', () => {
    const j = seed();
    expect(() => j.pickup('111111')).toThrow();
    j.acceptedBy('rider1');
    expect(() => j.pickup('xxxxxx')).toThrow();
    j.pickup('111111');
    expect(j.snapshot.status).toBe('picked_up');
  });

  it('deliver requires correct delivery code', () => {
    const j = seed();
    j.acceptedBy('r');
    j.pickup('111111');
    j.inTransit();
    expect(() => j.deliver('xxxxxx')).toThrow();
    j.deliver('222222');
    expect(j.snapshot.status).toBe('delivered');
  });

  it('cancel transitions to cancelled', () => {
    const j = seed();
    j.cancel();
    expect(j.snapshot.status).toBe('cancelled');
  });
});
