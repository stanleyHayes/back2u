import { injectable } from 'inversify';

import type { IZoneSubscriptionRepository } from '../../../../application/ports/repositories.js';
import {
  ZoneSubscription,
  type ZoneSubscriptionSnapshot,
} from '../../../../domain/subscription/zone-subscription.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { ZoneSubscriptionModel, type ZoneSubscriptionDoc } from '../models/zone.model.js';

const toSnapshot = (d: ZoneSubscriptionDoc): ZoneSubscriptionSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoZoneSubscriptionRepository implements IZoneSubscriptionRepository {
  async save(z: ZoneSubscription): Promise<void> {
    const { id, ...rest } = z.snapshot;
    await ZoneSubscriptionModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async delete(id: Id, ownerId: Id): Promise<void> {
    await ZoneSubscriptionModel.deleteOne({ _id: id, ownerId });
  }

  async listForOwner(ownerId: Id): Promise<ZoneSubscription[]> {
    const docs = await ZoneSubscriptionModel.find({ ownerId })
      .sort({ createdAt: -1 })
      .lean<ZoneSubscriptionDoc[]>();
    return docs.map((d) => ZoneSubscription.rehydrate(toSnapshot(d)));
  }

  async findContaining(point: { lng: number; lat: number }): Promise<ZoneSubscription[]> {
    const docs = await ZoneSubscriptionModel.find({
      polygon: {
        $geoIntersects: { $geometry: { type: 'Point', coordinates: [point.lng, point.lat] } },
      },
    }).lean<ZoneSubscriptionDoc[]>();
    return docs.map((d) => ZoneSubscription.rehydrate(toSnapshot(d)));
  }
}
