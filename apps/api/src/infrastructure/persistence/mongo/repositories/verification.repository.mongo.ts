import { injectable } from 'inversify';

import type { IVerificationRepository } from '../../../../application/ports/repositories.js';
import {
  OwnershipVerification,
  type VerificationSnapshot,
} from '../../../../domain/verification/verification.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { VerificationModel, type VerificationDoc } from '../models/verification.model.js';

const toSnapshot = (d: VerificationDoc): VerificationSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoVerificationRepository implements IVerificationRepository {
  async save(v: OwnershipVerification): Promise<void> {
    const { id, ...rest } = v.snapshot;
    await VerificationModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<OwnershipVerification | null> {
    const doc = await VerificationModel.findById(id).lean<VerificationDoc | null>();
    return doc ? OwnershipVerification.rehydrate(toSnapshot(doc)) : null;
  }

  async listForItem(itemId: Id): Promise<OwnershipVerification[]> {
    const docs = await VerificationModel.find({ itemId })
      .sort({ createdAt: -1 })
      .lean<VerificationDoc[]>();
    return docs.map((d) => OwnershipVerification.rehydrate(toSnapshot(d)));
  }

  async listPending(limit: number): Promise<OwnershipVerification[]> {
    const docs = await VerificationModel.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean<VerificationDoc[]>();
    return docs.map((d) => OwnershipVerification.rehydrate(toSnapshot(d)));
  }
}
