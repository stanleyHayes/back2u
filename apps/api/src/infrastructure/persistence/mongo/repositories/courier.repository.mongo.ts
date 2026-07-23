import { injectable } from 'inversify';

import type { ICourierJobRepository } from '../../../../application/ports/repositories.js';
import { CourierJob, type CourierJobSnapshot } from '../../../../domain/courier/courier-job.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { CourierJobModel, type CourierJobDoc } from '../models/courier.model.js';

const toSnapshot = (d: CourierJobDoc): CourierJobSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoCourierJobRepository implements ICourierJobRepository {
  async save(j: CourierJob): Promise<void> {
    const { id, ...rest } = j.snapshot;
    await CourierJobModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<CourierJob | null> {
    const doc = await CourierJobModel.findById(id).lean<CourierJobDoc | null>();
    return doc ? CourierJob.rehydrate(toSnapshot(doc)) : null;
  }

  async listForUser(userId: Id): Promise<CourierJob[]> {
    const docs = await CourierJobModel.find({ $or: [{ requesterId: userId }, { riderId: userId }] })
      .sort({ createdAt: -1 })
      .lean<CourierJobDoc[]>();
    return docs.map((d) => CourierJob.rehydrate(toSnapshot(d)));
  }

  async listOpen(near?: { lng: number; lat: number; radiusMeters: number }): Promise<CourierJob[]> {
    const q: Record<string, unknown> = { status: 'requested' };
    if (near) {
      q['pickup.point'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [near.lng, near.lat] },
          $maxDistance: near.radiusMeters,
        },
      };
    }
    // $near already returns distance-sorted results; only sort explicitly otherwise.
    const cursor = CourierJobModel.find(q);
    if (!near) cursor.sort({ createdAt: -1 });
    const docs = await cursor.lean<CourierJobDoc[]>();
    return docs.map((d) => CourierJob.rehydrate(toSnapshot(d)));
  }

  async count(): Promise<number> {
    return CourierJobModel.countDocuments();
  }

  async countByItemIds(itemIds: Id[]): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      CourierJobModel.countDocuments({ itemId: { $in: itemIds } }),
      CourierJobModel.countDocuments({
        itemId: { $in: itemIds },
        status: { $nin: ['delivered', 'cancelled'] },
      }),
    ]);
    return { total, active };
  }
}
