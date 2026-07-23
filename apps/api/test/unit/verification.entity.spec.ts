import { describe, expect, it } from 'vitest';

import { OwnershipVerification } from '../../src/domain/verification/verification.entity.js';

const submit = (score: number) =>
  OwnershipVerification.submit({
    id: 'v1',
    itemId: 'i1',
    claimantId: 'u1',
    answers: [],
    proofs: [{ kind: 'other', text: '' }],
    aiConsistencyScore: score,
  });

describe('OwnershipVerification', () => {
  it('auto-approves when AI score ≥ 0.85', () => {
    expect(submit(0.9).snapshot.status).toBe('approved');
  });
  it('queues when AI score < 0.85', () => {
    expect(submit(0.6).snapshot.status).toBe('pending');
  });
  it('approve / reject only from pending', () => {
    const v = submit(0.5);
    v.approve('rev', 'ok');
    expect(v.snapshot.status).toBe('approved');
    expect(() => v.approve('x')).toThrow();
  });
});
