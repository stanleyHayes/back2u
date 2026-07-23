import { describe, expect, it } from 'vitest';

import { Otp } from '../../src/domain/auth/otp.entity.js';

describe('Otp', () => {
  it('verifies the right code once', () => {
    const otp = Otp.issue({ id: 'o1', destination: '+233', channel: 'phone', code: '123456', ttlSeconds: 600 });
    expect(otp.verify('wrong', new Date()).ok).toBe(false);
    const r = otp.verify('123456', new Date());
    expect(r.ok).toBe(true);
    // After consume, should not verify again.
    expect(otp.verify('123456', new Date()).ok).toBe(false);
  });

  it('fails when expired', () => {
    const otp = Otp.issue({ id: 'o2', destination: 'a@b', channel: 'email', code: '999000', ttlSeconds: 1 });
    const future = new Date(Date.now() + 5_000);
    const r = otp.verify('999000', future);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('expired');
  });

  it('locks out after too many attempts', () => {
    const otp = Otp.issue({ id: 'o3', destination: 'x', channel: 'phone', code: '111111', ttlSeconds: 600 });
    for (let i = 0; i < 5; i++) otp.verify('000000', new Date());
    const r = otp.verify('000000', new Date());
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('too_many_attempts');
  });
});
