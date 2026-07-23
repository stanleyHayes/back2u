import type { VerificationProof, VerificationStatus } from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface VerificationSnapshot {
  id: Id;
  itemId: Id;
  claimantId: Id;
  answers: { questionId: string; answer: string }[];
  proofs: VerificationProof[];
  aiConsistencyScore: number;
  status: VerificationStatus;
  reviewerId?: Id;
  reviewerNote?: string;
  createdAt: Date;
  decidedAt?: Date;
}

export class OwnershipVerification {
  private constructor(private state: VerificationSnapshot) {}
  static rehydrate(s: VerificationSnapshot): OwnershipVerification {
    return new OwnershipVerification({ ...s });
  }
  static submit(input: {
    id: Id;
    itemId: Id;
    claimantId: Id;
    answers: VerificationSnapshot['answers'];
    proofs: VerificationProof[];
    aiConsistencyScore: number;
  }): OwnershipVerification {
    const auto = input.aiConsistencyScore >= 0.85 ? 'approved' : 'pending';
    return new OwnershipVerification({
      ...input,
      status: auto,
      createdAt: new Date(),
      decidedAt: auto === 'approved' ? new Date() : undefined,
    });
  }
  get snapshot(): VerificationSnapshot {
    return { ...this.state };
  }
  approve(reviewerId: Id, note?: string): void {
    if (this.state.status !== 'pending') throw new ConflictError(`Already ${this.state.status}`);
    this.state.status = 'approved';
    this.state.reviewerId = reviewerId;
    this.state.reviewerNote = note;
    this.state.decidedAt = new Date();
  }
  reject(reviewerId: Id, note: string): void {
    if (this.state.status !== 'pending') throw new ConflictError(`Already ${this.state.status}`);
    this.state.status = 'rejected';
    this.state.reviewerId = reviewerId;
    this.state.reviewerNote = note;
    this.state.decidedAt = new Date();
  }
}
