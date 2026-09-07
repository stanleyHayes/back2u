import type { RedemptionStatus, SupportedCurrency } from '@back2u/shared-types';

import { ConflictError, ValidationError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface RedemptionSnapshot {
  id: Id;
  userId: Id;
  institutionId: Id;
  points: number;
  value: number; // minor currency units
  currency: SupportedCurrency;
  code: string;
  status: RedemptionStatus;
  note?: string;
  /** Set when this came from a catalogue offer rather than a plain spend. */
  offerId?: Id;
  offerTitle?: string;
  /** When an uncollected reservation returns to the pool (spec §13 EXPIRED). */
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  fulfilledAt?: Date;
  /** When it expired or was reversed. */
  resolvedAt?: Date;
}

export class PointsRedemption {
  private constructor(private state: RedemptionSnapshot) {}

  static rehydrate(s: RedemptionSnapshot): PointsRedemption {
    return new PointsRedemption({ ...s });
  }

  static create(input: {
    id: Id;
    userId: Id;
    institutionId: Id;
    points: number;
    value: number;
    currency: SupportedCurrency;
    code: string;
    note?: string;
    offerId?: Id;
    offerTitle?: string;
    expiresAt?: Date;
  }): PointsRedemption {
    if (input.points <= 0) throw new ValidationError('Points must be positive');
    const now = new Date();
    return new PointsRedemption({
      ...input,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): Id {
    return this.state.id;
  }
  get status(): RedemptionStatus {
    return this.state.status;
  }
  /** True while the reservation is still live and collectable. */
  get isReserved(): boolean {
    return this.state.status === 'pending';
  }
  /** True once the hold has lapsed and the points should return to the member. */
  isDue(now: Date): boolean {
    return (
      this.state.status === 'pending' &&
      this.state.expiresAt !== undefined &&
      this.state.expiresAt <= now
    );
  }
  get snapshot(): RedemptionSnapshot {
    return { ...this.state };
  }

  fulfil(): void {
    if (this.state.status !== 'pending') throw new ConflictError('Redemption is not pending');
    this.state.status = 'fulfilled';
    this.state.fulfilledAt = new Date();
    this.state.updatedAt = this.state.fulfilledAt;
  }

  cancel(): void {
    if (this.state.status !== 'pending') {
      throw new ConflictError(`Cannot cancel a ${this.state.status} redemption`);
    }
    this.state.status = 'cancelled';
    this.state.resolvedAt = new Date();
    this.state.updatedAt = this.state.resolvedAt;
  }

  /**
   * The member never collected it. The caller returns their points and restores
   * the offer's inventory — an expiry that silently swallowed both would be a
   * quiet way for a partner to take payment for nothing.
   */
  expire(now = new Date()): void {
    if (this.state.status !== 'pending') {
      throw new ConflictError(`Cannot expire a ${this.state.status} redemption`);
    }
    this.state.status = 'expired';
    this.state.resolvedAt = now;
    this.state.updatedAt = now;
  }

  /** Clawed back after a dispute or a confirmed fraud (§13 REVERSED). */
  reverse(note: string): void {
    if (this.state.status === 'reversed') throw new ConflictError('Redemption already reversed');
    this.state.status = 'reversed';
    this.state.note = note;
    this.state.resolvedAt = new Date();
    this.state.updatedAt = this.state.resolvedAt;
  }
}
