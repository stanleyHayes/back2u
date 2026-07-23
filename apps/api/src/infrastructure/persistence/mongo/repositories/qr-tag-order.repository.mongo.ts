import { injectable } from 'inversify';

import type { IQrTagOrderRepository } from '../../../../application/ports/repositories.js';
import { QrTagOrder, type QrTagOrderSnapshot } from '../../../../domain/tag/qr-tag-order.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { QrTagOrderModel, type QrTagOrderDoc } from '../models/qr-tag.model.js';

const toSnapshot = (d: QrTagOrderDoc): QrTagOrderSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoQrTagOrderRepository implements IQrTagOrderRepository {
  async save(order: QrTagOrder): Promise<void> {
    const { id, ...rest } = order.snapshot;
    await QrTagOrderModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<QrTagOrder | null> {
    const doc = await QrTagOrderModel.findById(id).lean<QrTagOrderDoc | null>();
    return doc ? QrTagOrder.rehydrate(toSnapshot(doc)) : null;
  }

  async listForUser(userId: Id): Promise<QrTagOrder[]> {
    const docs = await QrTagOrderModel.find({ userId }).sort({ createdAt: -1 }).lean<QrTagOrderDoc[]>();
    return docs.map((d) => QrTagOrder.rehydrate(toSnapshot(d)));
  }
}
