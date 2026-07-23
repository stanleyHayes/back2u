import type { Id } from '../shared/id.js';

export interface WebPushSubscriptionSnapshot {
  id: Id;
  userId: Id;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  createdAt: Date;
}

export class WebPushSubscription {
  private constructor(private state: WebPushSubscriptionSnapshot) {}
  static rehydrate(s: WebPushSubscriptionSnapshot): WebPushSubscription {
    return new WebPushSubscription({ ...s });
  }
  static register(input: Omit<WebPushSubscriptionSnapshot, 'createdAt'>): WebPushSubscription {
    return new WebPushSubscription({ ...input, createdAt: new Date() });
  }
  get snapshot(): WebPushSubscriptionSnapshot {
    return { ...this.state };
  }
}
