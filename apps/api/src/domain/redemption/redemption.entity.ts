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
  createdAt: Date;
  updatedAt: Date;
  fulfilledAt?: Date;
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
    if (this.state.status === 'fulfilled') throw new ConflictError('Cannot cancel a fulfilled redemption');
    this.state.status = 'cancelled';
    this.state.updatedAt = new Date();
  }
}
