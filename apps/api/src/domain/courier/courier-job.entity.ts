import type { CourierStatus, PlaceRef } from '@back2u/shared-types';

import { ConflictError, ForbiddenError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface CourierJobSnapshot {
  id: Id;
  itemId: Id;
  pickup: PlaceRef;
  dropoff: PlaceRef;
  fee: number;
  currency: string;
  status: CourierStatus;
  riderId?: Id;
  requesterId: Id;
  pickupCode: string;
  deliveryCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CourierJob {
  private constructor(private state: CourierJobSnapshot) {}
  static rehydrate(s: CourierJobSnapshot): CourierJob {
    return new CourierJob({ ...s });
  }
  static request(input: Omit<CourierJobSnapshot, 'status' | 'createdAt' | 'updatedAt'>): CourierJob {
    const now = new Date();
    return new CourierJob({ ...input, status: 'requested', createdAt: now, updatedAt: now });
  }
  get snapshot(): CourierJobSnapshot {
    return { ...this.state };
  }
  acceptedBy(riderId: Id): void {
    if (this.state.status !== 'requested') throw new ConflictError(`status=${this.state.status}`);
    this.state.riderId = riderId;
    this.state.status = 'accepted';
    this.state.updatedAt = new Date();
  }
  pickup(code: string): void {
    if (this.state.status !== 'accepted') throw new ConflictError(`status=${this.state.status}`);
    if (code !== this.state.pickupCode) throw new ForbiddenError('Invalid pickup code');
    this.state.status = 'picked_up';
    this.state.updatedAt = new Date();
  }
  inTransit(): void {
    if (this.state.status !== 'picked_up') throw new ConflictError(`status=${this.state.status}`);
    this.state.status = 'in_transit';
    this.state.updatedAt = new Date();
  }
  deliver(code: string): void {
    if (this.state.status !== 'in_transit') throw new ConflictError(`status=${this.state.status}`);
    if (code !== this.state.deliveryCode) throw new ForbiddenError('Invalid delivery code');
    this.state.status = 'delivered';
    this.state.updatedAt = new Date();
  }
  cancel(): void {
    this.state.status = 'cancelled';
    this.state.updatedAt = new Date();
  }
}
