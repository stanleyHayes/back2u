import { describe, expect, it } from 'vitest';

import { hashToken } from '../../src/domain/auth/refresh-token.entity.js';
import { IdempotencyRecord } from '../../src/domain/idempotency/idempotency-key.entity.js';

describe('IdempotencyRecord', () => {
  it('seal stores hash, ttl + payload', () => {
    const r = IdempotencyRecord.seal({
      id: 'r1',
      rawKey: 'u1:POST:/v1/items:k',
      userId: 'u1',
      method: 'POST',
      path: '/v1/items',
      status: 201,
      responseBody: '{"data":{"id":"i1"}}',
      ttlSeconds: 3600,
    });
    expect(r.snapshot.keyHash).toBe(hashToken('u1:POST:/v1/items:k'));
    expect(r.snapshot.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(r.snapshot.responseBody).toContain('"id":"i1"');
  });
});
