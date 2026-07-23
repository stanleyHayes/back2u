import { injectable } from 'inversify';

import type { Id } from '../../../../domain/shared/id.js';
import {
  WebPushSubscription,
  type WebPushSubscriptionSnapshot,
} from '../../../../domain/web_push/subscription.entity.js';
import { WebPushSubscriptionModel } from '../models/web-push.model.js';

export interface IWebPushSubscriptionRepository {
  save(s: WebPushSubscription): Promise<void>;
  listForUser(userId: Id): Promise<WebPushSubscription[]>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}

type WebPushSubscriptionDoc = Omit<WebPushSubscriptionSnapshot, 'id'> & { _id: unknown };

const toSnapshot = (d: WebPushSubscriptionDoc): WebPushSubscriptionSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};

@injectable()
export class MongoWebPushSubscriptionRepository implements IWebPushSubscriptionRepository {
  async save(s: WebPushSubscription): Promise<void> {
    const { id, ...rest } = s.snapshot;
    await WebPushSubscriptionModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async listForUser(userId: Id): Promise<WebPushSubscription[]> {
    const docs = await WebPushSubscriptionModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean<WebPushSubscriptionDoc[]>();
    return docs.map((d) => WebPushSubscription.rehydrate(toSnapshot(d)));
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await WebPushSubscriptionModel.deleteOne({ endpoint });
  }
}
