import { injectable } from 'inversify';

import type { IQrTagRepository } from '../../../../application/ports/repositories.js';
import { QrTag, type QrTagSnapshot } from '../../../../domain/tag/qr-tag.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { QrTagModel, type QrTagDoc } from '../models/qr-tag.model.js';

const toSnapshot = (d: QrTagDoc): QrTagSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoQrTagRepository implements IQrTagRepository {
  async save(tag: QrTag): Promise<void> {
    const { id, ...rest } = tag.snapshot;
    await QrTagModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async saveMany(tags: QrTag[]): Promise<void> {
    if (tags.length === 0) return;
    await QrTagModel.bulkWrite(
      tags.map((tag) => {
        const { id, ...rest } = tag.snapshot;
        return { replaceOne: { filter: { _id: id }, replacement: { _id: id, ...rest }, upsert: true } };
      }),
    );
  }

  async findById(id: Id): Promise<QrTag | null> {
    const doc = await QrTagModel.findById(id).lean<QrTagDoc | null>();
    return doc ? QrTag.rehydrate(toSnapshot(doc)) : null;
  }

  async findByCode(code: string): Promise<QrTag | null> {
    const doc = await QrTagModel.findOne({ code }).lean<QrTagDoc | null>();
    return doc ? QrTag.rehydrate(toSnapshot(doc)) : null;
  }

  async listForOwner(ownerId: Id): Promise<QrTag[]> {
    const docs = await QrTagModel.find({ ownerId }).sort({ createdAt: -1 }).lean<QrTagDoc[]>();
    return docs.map((d) => QrTag.rehydrate(toSnapshot(d)));
  }
}
