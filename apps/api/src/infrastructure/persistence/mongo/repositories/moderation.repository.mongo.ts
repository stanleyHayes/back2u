import { injectable } from 'inversify';

import type { IModerationQueueRepository } from '../../../../application/ports/repositories.js';
import {
  ModerationQueueItem,
  type ModerationQueueItemSnapshot,
} from '../../../../domain/moderation/moderation-queue-item.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import {
  ModerationQueueItemModel,
  type ModerationQueueItemDoc,
} from '../models/moderation.model.js';

const toSnapshot = (d: ModerationQueueItemDoc): ModerationQueueItemSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoModerationQueueRepository implements IModerationQueueRepository {
  async save(item: ModerationQueueItem): Promise<void> {
    const { id, ...rest } = item.snapshot;
    await ModerationQueueItemModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<ModerationQueueItem | null> {
    const doc = await ModerationQueueItemModel.findById(id).lean<ModerationQueueItemDoc | null>();
    return doc ? ModerationQueueItem.rehydrate(toSnapshot(doc)) : null;
  }

  async list(filter: { type?: string; status?: string; limit: number }): Promise<ModerationQueueItem[]> {
    const q: Record<string, unknown> = {};
    if (filter.type) q.type = filter.type;
    if (filter.status) q.status = filter.status;
    const docs = await ModerationQueueItemModel.find(q)
      .sort({ createdAt: -1 })
      .limit(filter.limit)
      .lean<ModerationQueueItemDoc[]>();
    return docs.map((d) => ModerationQueueItem.rehydrate(toSnapshot(d)));
  }
}
