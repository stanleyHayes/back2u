import { injectable } from 'inversify';

import type { IQrTagProductRepository } from '../../../../application/ports/repositories.js';
import {
  QrTagProduct,
  type QrTagProductSnapshot,
} from '../../../../domain/tag/qr-tag-product.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { QrTagProductModel, type QrTagProductDoc } from '../models/qr-tag.model.js';

const toSnapshot = (d: QrTagProductDoc): QrTagProductSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoQrTagProductRepository implements IQrTagProductRepository {
  async save(product: QrTagProduct): Promise<void> {
    const { id, ...rest } = product.snapshot;
    await QrTagProductModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<QrTagProduct | null> {
    const doc = await QrTagProductModel.findById(id).lean<QrTagProductDoc | null>();
    return doc ? QrTagProduct.rehydrate(toSnapshot(doc)) : null;
  }

  async list(): Promise<QrTagProduct[]> {
    const docs = await QrTagProductModel.find().sort({ createdAt: 1 }).lean<QrTagProductDoc[]>();
    return docs.map((d) => QrTagProduct.rehydrate(toSnapshot(d)));
  }
}
