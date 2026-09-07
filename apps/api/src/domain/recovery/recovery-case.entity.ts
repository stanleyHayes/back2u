import type { RecoveryCaseDTO, RecoveryCaseStatus, VerificationLevel } from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface RecoveryCaseSnapshot {
  id: Id;
  reference: string;
  foundItemId: Id;
  lostItemId?: Id;
  matchId?: Id;
  finderId: Id;
  claimantId?: Id;
  status: RecoveryCaseStatus;
  verificationLevel: VerificationLevel;
  custodyRecordId?: Id;
  institutionId?: Id;
  locationId?: Id;
  /** Highest event sequence issued so far; the next event takes this + 1. */
  lastSequence: number;
  openedAt: Date;
  closedAt?: Date;
  updatedAt: Date;
}

/**
 * Legal forward transitions. A case only ever moves down this ladder, except
 * for cancellation, which is reachable from any open state.
 */
const ORDER: RecoveryCaseStatus[] = [
  'found',
  'deposited',
  'matched',
  'claim_submitted',
  'ownership_verified',
  'released',
  'returned',
  'closed',
];

const rank = (s: RecoveryCaseStatus): number => ORDER.indexOf(s);

/**
 * The end-to-end recovery a found item travels through (spec §4, §9).
 *
 * Deliberately separate from `Match`, which models a lost/found *pair*: a
 * Recovery Point can hold an item for weeks before any lost report matches it,
 * so custody cannot hang off a match. The case owns the lifecycle; the match,
 * when one appears, is recorded on it.
 */
export class RecoveryCase {
  private constructor(private state: RecoveryCaseSnapshot) {}

  static rehydrate(s: RecoveryCaseSnapshot): RecoveryCase {
    return new RecoveryCase({ ...s });
  }

  static open(input: {
    id: Id;
    reference: string;
    foundItemId: Id;
    finderId: Id;
    institutionId?: Id;
  }): RecoveryCase {
    const now = new Date();
    return new RecoveryCase({
      ...input,
      status: 'found',
      verificationLevel: 'peer',
      lastSequence: 0,
      openedAt: now,
      updatedAt: now,
    });
  }

  get id(): Id {
    return this.state.id;
  }
  get status(): RecoveryCaseStatus {
    return this.state.status;
  }
  get snapshot(): RecoveryCaseSnapshot {
    return { ...this.state };
  }
  get isOpen(): boolean {
    return this.state.status !== 'closed' && this.state.status !== 'cancelled';
  }

  /** Claims the next event sequence number for this case. */
  nextSequence(): number {
    this.state.lastSequence += 1;
    this.state.updatedAt = new Date();
    return this.state.lastSequence;
  }

  private advance(to: RecoveryCaseStatus): void {
    if (!this.isOpen) throw new ConflictError(`Case is ${this.state.status}`);
    if (rank(to) <= rank(this.state.status)) {
      throw new ConflictError(`Cannot move a case from ${this.state.status} back to ${to}`);
    }
    this.state.status = to;
    this.state.updatedAt = new Date();
  }

  acceptCustody(input: {
    custodyRecordId: Id;
    institutionId: Id;
    locationId: Id;
    verificationLevel: VerificationLevel;
  }): void {
    this.advance('deposited');
    this.state.custodyRecordId = input.custodyRecordId;
    this.state.institutionId = input.institutionId;
    this.state.locationId = input.locationId;
    this.state.verificationLevel = input.verificationLevel;
  }

  attachMatch(matchId: Id, lostItemId: Id): void {
    this.advance('matched');
    this.state.matchId = matchId;
    this.state.lostItemId = lostItemId;
  }

  submitClaim(claimantId: Id): void {
    this.advance('claim_submitted');
    this.state.claimantId = claimantId;
  }

  verifyOwnership(claimantId: Id): void {
    this.advance('ownership_verified');
    this.state.claimantId = claimantId;
  }

  release(): void {
    this.advance('released');
  }

  confirmReturn(): void {
    this.advance('returned');
  }

  close(): void {
    this.advance('closed');
    this.state.closedAt = new Date();
  }

  cancel(): void {
    if (!this.isOpen) throw new ConflictError(`Case is already ${this.state.status}`);
    this.state.status = 'cancelled';
    this.state.closedAt = new Date();
    this.state.updatedAt = this.state.closedAt;
  }
}

export function toRecoveryCaseDTO(c: RecoveryCase): RecoveryCaseDTO {
  const s = c.snapshot;
  return {
    id: s.id,
    reference: s.reference,
    foundItemId: s.foundItemId,
    lostItemId: s.lostItemId,
    matchId: s.matchId,
    finderId: s.finderId,
    claimantId: s.claimantId,
    status: s.status,
    verificationLevel: s.verificationLevel,
    custodyRecordId: s.custodyRecordId,
    institutionId: s.institutionId,
    locationId: s.locationId,
    openedAt: s.openedAt.toISOString(),
    closedAt: s.closedAt?.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
