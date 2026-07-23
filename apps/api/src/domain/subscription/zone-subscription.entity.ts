import type { GeoPolygon } from '@back2u/shared-types';

import type { Id } from '../shared/id.js';

export interface ZoneSubscriptionSnapshot {
  id: Id;
  ownerId: Id;
  name: string;
  polygon: GeoPolygon;
  channels: ('push' | 'email' | 'sms')[];
  createdAt: Date;
}

export class ZoneSubscription {
  private constructor(private state: ZoneSubscriptionSnapshot) {}
  static rehydrate(s: ZoneSubscriptionSnapshot): ZoneSubscription {
    return new ZoneSubscription({ ...s });
  }
  static create(input: Omit<ZoneSubscriptionSnapshot, 'createdAt'>): ZoneSubscription {
    return new ZoneSubscription({ ...input, createdAt: new Date() });
  }
  get snapshot(): ZoneSubscriptionSnapshot {
    return { ...this.state };
  }
}
