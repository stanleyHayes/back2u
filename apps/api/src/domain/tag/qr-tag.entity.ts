import type { GeoPoint } from '@back2u/shared-types';
import type { TagStatus } from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface QrTagSnapshot {
  id: Id;
  code: string;
  ownerId?: Id;
  itemLabel?: string;
  status: TagStatus;
  lastSeenAt?: Date;
  lastSeenPoint?: GeoPoint;
  createdAt: Date;
  updatedAt: Date;
}

export class QrTag {
  private constructor(private state: QrTagSnapshot) {}
  static rehydrate(s: QrTagSnapshot): QrTag {
    return new QrTag({ ...s });
  }
  static mint(input: { id: Id; code: string }): QrTag {
    const now = new Date();
    return new QrTag({
      id: input.id,
      code: input.code,
      status: 'unclaimed',
      createdAt: now,
      updatedAt: now,
    });
  }
  get snapshot(): QrTagSnapshot {
    return { ...this.state };
  }
  claim(ownerId: Id, itemLabel?: string): void {
    if (this.state.ownerId !== undefined && this.state.ownerId !== ownerId) {
      throw new ConflictError('Tag already claimed');
    }
    this.state.ownerId = ownerId;
    this.state.itemLabel = itemLabel;
    this.state.status = 'active';
    this.state.updatedAt = new Date();
  }
  markLost(): void {
    this.state.status = 'lost';
    this.state.updatedAt = new Date();
  }
  recordHeartbeat(point: GeoPoint): void {
    this.state.lastSeenAt = new Date();
    this.state.lastSeenPoint = point;
    this.state.updatedAt = new Date();
  }
  disable(): void {
    this.state.status = 'disabled';
    this.state.updatedAt = new Date();
  }
}
