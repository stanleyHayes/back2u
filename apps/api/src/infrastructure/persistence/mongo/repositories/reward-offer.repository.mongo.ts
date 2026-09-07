import type { RewardOfferStatus } from '@back2u/shared-types';
import { injectable } from 'inversify';

import type { IRewardOfferRepository } from '../../../../application/ports/reward-catalog-repos.js';
import {
  RewardOffer,
  type RewardOfferSnapshot,
} from '../../../../domain/reward_catalog/reward-offer.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { RewardOfferModel, type RewardOfferDoc } from '../models/reward-offer.model.js';

const toSnapshot = (d: RewardOfferDoc): RewardOfferSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoRewardOfferRepository implements IRewardOfferRepository {
  async save(o: RewardOffer): Promise<void> {
    const { id, ...rest } = o.snapshot;
    await RewardOfferModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<RewardOffer | null> {
    const doc = await RewardOfferModel.findById(id).lean<RewardOfferDoc | null>();
    return doc ? RewardOffer.rehydrate(toSnapshot(doc)) : null;
  }

  async listForInstitution(institutionId: Id): Promise<RewardOffer[]> {
    const docs = await RewardOfferModel.find({ institutionId })
      .sort({ createdAt: -1 })
      .lean<RewardOfferDoc[]>();
    return docs.map((d) => RewardOffer.rehydrate(toSnapshot(d)));
  }

  async listLive(
    now: Date,
    opts: { limit: number; skip: number; institutionId?: Id },
  ): Promise<{ offers: RewardOffer[]; total: number }> {
    const filter: Record<string, unknown> = {
      status: 'live',
      $and: [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
      ],
    };
    if (opts.institutionId) filter.institutionId = opts.institutionId;

    const [docs, total] = await Promise.all([
      RewardOfferModel.find(filter)
        .sort({ pointsCost: 1, createdAt: -1 })
        .skip(opts.skip)
        .limit(opts.limit)
        .lean<RewardOfferDoc[]>(),
      RewardOfferModel.countDocuments(filter),
    ]);
    return { offers: docs.map((d) => RewardOffer.rehydrate(toSnapshot(d))), total };
  }

  async countByStatus(institutionId: Id): Promise<Record<RewardOfferStatus, number>> {
    const rows = await RewardOfferModel.aggregate<{ _id: RewardOfferStatus; count: number }>([
      { $match: { institutionId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const by: Record<RewardOfferStatus, number> = { draft: 0, live: 0, paused: 0, ended: 0 };
    for (const r of rows) by[r._id] = r.count;
    return by;
  }

  async tryReserveStock(offerId: Id): Promise<boolean> {
    // Unlimited offers store no `remainingInventory`, so they always succeed.
    const unlimited = await RewardOfferModel.updateOne(
      { _id: offerId, remainingInventory: { $exists: false } },
      { $set: { updatedAt: new Date() } },
    );
    if (unlimited.matchedCount === 1) return true;

    // Conditional on stock remaining, so only one of two concurrent reservers
    // can win the last unit.
    const res = await RewardOfferModel.updateOne(
      { _id: offerId, remainingInventory: { $gt: 0 } },
      { $inc: { remainingInventory: -1 }, $set: { updatedAt: new Date() } },
    );
    return res.modifiedCount === 1;
  }

  async restoreStock(offerId: Id): Promise<void> {
    const doc = await RewardOfferModel.findById(offerId)
      .select({ totalInventory: 1, remainingInventory: 1 })
      .lean<{ totalInventory?: number; remainingInventory?: number } | null>();
    if (!doc || doc.totalInventory === undefined) return;
    // Never push stock above the declared total, however many restores land.
    await RewardOfferModel.updateOne(
      { _id: offerId, remainingInventory: { $lt: doc.totalInventory } },
      { $inc: { remainingInventory: 1 }, $set: { updatedAt: new Date() } },
    );
  }
}
