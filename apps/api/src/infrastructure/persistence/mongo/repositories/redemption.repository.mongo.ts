import { injectable } from 'inversify';

import type { IRedemptionRepository } from '../../../../application/ports/redemption-repo.js';
import {
  PointsRedemption,
  type RedemptionSnapshot,
} from '../../../../domain/redemption/redemption.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { RedemptionModel, type RedemptionDoc } from '../models/redemption.model.js';

const toSnapshot = (d: RedemptionDoc): RedemptionSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: _id };
};

@injectable()
export class MongoRedemptionRepository implements IRedemptionRepository {
  async save(r: PointsRedemption): Promise<void> {
    const { id, ...rest } = r.snapshot;
    await RedemptionModel.replaceOne({ _id: id }, { _id: id, ...rest }, { upsert: true });
  }

  async findById(id: Id): Promise<PointsRedemption | null> {
    const doc = await RedemptionModel.findById(id).lean<RedemptionDoc | null>();
    return doc ? PointsRedemption.rehydrate(toSnapshot(doc)) : null;
  }

  async findByCode(code: string): Promise<PointsRedemption | null> {
    const doc = await RedemptionModel.findOne({ code }).lean<RedemptionDoc | null>();
    return doc ? PointsRedemption.rehydrate(toSnapshot(doc)) : null;
  }

  async listForUser(userId: Id, limit = 50): Promise<PointsRedemption[]> {
    const docs = await RedemptionModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<RedemptionDoc[]>();
    return docs.map((d) => PointsRedemption.rehydrate(toSnapshot(d)));
  }

  async listForInstitution(institutionId: Id, limit = 50): Promise<PointsRedemption[]> {
    const docs = await RedemptionModel.find({ institutionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<RedemptionDoc[]>();
    return docs.map((d) => PointsRedemption.rehydrate(toSnapshot(d)));
  }

  async countByInstitution(institutionId: Id): Promise<{ count: number; totalPoints: number }> {
    const rows = await RedemptionModel.aggregate<{ count: number; totalPoints: number }>([
      { $match: { institutionId, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
      { $project: { _id: 0, count: 1, totalPoints: 1 } },
    ]);
    return rows[0] ?? { count: 0, totalPoints: 0 };
  }

  async countForUserAndOffer(userId: Id, offerId: Id): Promise<number> {
    // Expired, cancelled and reversed claims are released back to the member,
    // so only live and collected ones count against their limit.
    return RedemptionModel.countDocuments({
      userId,
      offerId,
      status: { $in: ['pending', 'fulfilled'] },
    });
  }

  async findDueReservations(now: Date, limit: number): Promise<PointsRedemption[]> {
    const docs = await RedemptionModel.find({ status: 'pending', expiresAt: { $lte: now } })
      .sort({ expiresAt: 1 })
      .limit(limit)
      .lean<RedemptionDoc[]>();
    return docs.map((d) => PointsRedemption.rehydrate(toSnapshot(d)));
  }

  async statsForOffer(offerId: Id): Promise<Record<string, { count: number; points: number }>> {
    const rows = await RedemptionModel.aggregate<{ _id: string; count: number; points: number }>([
      { $match: { offerId } },
      { $group: { _id: '$status', count: { $sum: 1 }, points: { $sum: '$points' } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, { count: r.count, points: r.points }]));
  }

  async listRecentByInstitution(institutionId: Id, limit: number): Promise<PointsRedemption[]> {
    const docs = await RedemptionModel.find({ institutionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<RedemptionDoc[]>();
    return docs.map((d) => PointsRedemption.rehydrate(toSnapshot(d)));
  }
}
