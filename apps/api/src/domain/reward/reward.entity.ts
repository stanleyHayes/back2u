import type { RewardStatus } from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface RewardSnapshot {
  id: Id;
  itemId: Id;
  amount: number;
  currency: string;
  pointsBonus: number;
  status: RewardStatus;
  finderId?: Id;
  releasedAt?: Date;
  commissionAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Reward {
  private constructor(private state: RewardSnapshot) {}
  static rehydrate(s: RewardSnapshot): Reward {
    return new Reward({ ...s });
  }
  static create(input: { id: Id; itemId: Id; amount: number; currency: string; pointsBonus?: number }): Reward {
    const now = new Date();
    return new Reward({
      ...input,
      pointsBonus: input.pointsBonus ?? Math.floor(input.amount / 5),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }
  get snapshot(): RewardSnapshot {
    return { ...this.state };
  }
  hold(): void {
    this.state.status = 'held';
    this.state.updatedAt = new Date();
  }
  release(finderId: Id, commissionRate = 0): void {
    if (this.state.status !== 'held') throw new ConflictError(`Reward not held (status=${this.state.status})`);
    this.state.status = 'released';
    this.state.finderId = finderId;
    this.state.releasedAt = new Date();
    this.state.commissionAmount = Math.max(0, Math.round(this.state.amount * commissionRate));
    this.state.updatedAt = new Date();
  }

  /** Net payout to the finder after the platform commission. */
  get netPayout(): number {
    return Math.max(0, this.state.amount - (this.state.commissionAmount ?? 0));
  }
}
