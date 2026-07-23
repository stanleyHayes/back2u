import { describe, expect, it } from 'vitest';

import { hashToken, RefreshToken } from '../../src/domain/auth/refresh-token.entity.js';

describe('RefreshToken', () => {
  it('matches on raw token via hash', () => {
    const t = RefreshToken.issue({
      id: 't1',
      userId: 'u1',
      rawToken: 'super-secret-token',
      expiresAt: new Date(Date.now() + 1000),
    });
    expect(t.matches('super-secret-token')).toBe(true);
    expect(t.matches('other')).toBe(false);
    expect(t.snapshot.tokenHash).toBe(hashToken('super-secret-token'));
  });

  it('treats expired tokens as inactive', () => {
    const t = RefreshToken.issue({
      id: 't2',
      userId: 'u1',
      rawToken: 'x',
      expiresAt: new Date(Date.now() - 1),
    });
    expect(t.isActive(new Date())).toBe(false);
  });

  it('revoked tokens are inactive', () => {
    const t = RefreshToken.issue({ id: 't3', userId: 'u1', rawToken: 'x', expiresAt: new Date(Date.now() + 1000) });
    t.revoke();
    expect(t.isActive(new Date())).toBe(false);
  });
});
