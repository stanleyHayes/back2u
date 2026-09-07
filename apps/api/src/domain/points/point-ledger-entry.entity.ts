import type {
  PointAction,
  PointAwardReason,
  PointEntryStatus,
  PointLedgerEntryDTO,
  VerificationLevel,
} from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface PointLedgerEntrySnapshot {
  id: Id;
  userId: Id;
  action: PointAction;
  points: number;
  basePoints: number;
  multiplier: number;
  status: PointEntryStatus;
  verificationLevel?: VerificationLevel;
  caseRef?: Id;
  itemId?: Id;
  counterpartyId?: Id;
  reasons: PointAwardReason[];
  pendingUntil?: Date;
  clearedAt?: Date;
  /**
   * When the balance credit for this entry actually landed. `clearedAt` without
   * `creditedAt` means the clearing pass died between the two writes, and the
   * next pass must finish the job rather than skip the entry.
   */
  creditedAt?: Date;
  reversedAt?: Date;
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One append-oriented BakPoints movement. Spec §24 requires ledger events to be
 * auditable, so `points` and `action` are fixed at creation: the only permitted
 * mutations are lifecycle transitions out of `pending`.
 */
export class PointLedgerEntry {
  private constructor(private state: PointLedgerEntrySnapshot) {}

  static rehydrate(s: PointLedgerEntrySnapshot): PointLedgerEntry {
    return new PointLedgerEntry({ ...s });
  }

  /** A credit that must sit out the holding period before it is spendable. */
  static pending(input: {
    id: Id;
    userId: Id;
    action: PointAction;
    points: number;
    basePoints: number;
    multiplier: number;
    pendingUntil: Date;
    verificationLevel?: VerificationLevel;
    caseRef?: Id;
    itemId?: Id;
    counterpartyId?: Id;
    reasons?: PointAwardReason[];
  }): PointLedgerEntry {
    const now = new Date();
    return new PointLedgerEntry({
      ...input,
      status: 'pending',
      reasons: input.reasons ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * A movement that takes effect immediately — spending points at a partner,
   * an admin adjustment, or a fraud penalty. The caller has already applied it
   * to the user's balance.
   */
  static settled(input: {
    id: Id;
    userId: Id;
    action: PointAction;
    points: number;
    caseRef?: Id;
    itemId?: Id;
    counterpartyId?: Id;
    reasons?: PointAwardReason[];
    resolutionNote?: string;
  }): PointLedgerEntry {
    const now = new Date();
    return new PointLedgerEntry({
      ...input,
      basePoints: input.points,
      multiplier: 1,
      status: 'cleared',
      reasons: input.reasons ?? [],
      clearedAt: now,
      // A settled movement is applied to the balance by its caller in the same
      // breath, so it is credited by construction.
      creditedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): Id {
    return this.state.id;
  }
  get snapshot(): PointLedgerEntrySnapshot {
    return { ...this.state, reasons: [...this.state.reasons] };
  }
  get points(): number {
    return this.state.points;
  }
  get userId(): Id {
    return this.state.userId;
  }
  get status(): PointEntryStatus {
    return this.state.status;
  }
  /** True once the points have reached the user's spendable balance. */
  get isCredited(): boolean {
    return this.state.creditedAt !== undefined;
  }

  markCredited(at = new Date()): void {
    this.state.creditedAt = at;
    this.state.updatedAt = at;
  }

  /** True once the holding period has elapsed and the entry may be cleared. */
  isDue(now: Date): boolean {
    return (
      this.state.status === 'pending' &&
      this.state.pendingUntil !== undefined &&
      this.state.pendingUntil <= now
    );
  }

  clear(): void {
    if (this.state.status !== 'pending') {
      throw new ConflictError(`Ledger entry is not pending (status=${this.state.status})`);
    }
    this.state.status = 'cleared';
    this.state.clearedAt = new Date();
    this.state.updatedAt = this.state.clearedAt;
  }

  /**
   * Claw the entry back after confirmed fraud or a lost dispute. A cleared
   * entry's points must be deducted from the balance by the caller; a pending
   * one never reached the balance.
   */
  reverse(note: string): void {
    if (this.state.status === 'reversed') throw new ConflictError('Ledger entry already reversed');
    if (this.state.status === 'cancelled') throw new ConflictError('Ledger entry was cancelled');
    this.state.status = 'reversed';
    this.state.reversedAt = new Date();
    this.state.resolutionNote = note;
    this.state.updatedAt = this.state.reversedAt;
  }

  /** Void a pending entry that should never have existed. */
  cancel(note: string): void {
    if (this.state.status !== 'pending') {
      throw new ConflictError(
        `Only a pending entry can be cancelled (status=${this.state.status})`,
      );
    }
    this.state.status = 'cancelled';
    this.state.resolutionNote = note;
    this.state.updatedAt = new Date();
  }

  /** Push a pending entry's release date out, e.g. after a risk escalation. */
  extendHold(until: Date): void {
    if (this.state.status !== 'pending') {
      throw new ConflictError(`Only a pending entry can be held (status=${this.state.status})`);
    }
    if (!this.state.pendingUntil || until > this.state.pendingUntil) {
      this.state.pendingUntil = until;
      this.state.updatedAt = new Date();
    }
  }
}

export function toPointLedgerEntryDTO(e: PointLedgerEntry): PointLedgerEntryDTO {
  const s = e.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    action: s.action,
    points: s.points,
    basePoints: s.basePoints,
    multiplier: s.multiplier,
    status: s.status,
    verificationLevel: s.verificationLevel,
    caseRef: s.caseRef,
    itemId: s.itemId,
    counterpartyId: s.counterpartyId,
    reasons: s.reasons,
    pendingUntil: s.pendingUntil?.toISOString(),
    clearedAt: s.clearedAt?.toISOString(),
    reversedAt: s.reversedAt?.toISOString(),
    resolutionNote: s.resolutionNote,
    createdAt: s.createdAt.toISOString(),
  };
}
