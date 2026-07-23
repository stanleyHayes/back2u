import { injectable } from 'inversify';

import type { IMatchRepository } from '../../../../application/ports/repositories.js';
import { Match, type MatchSnapshot } from '../../../../domain/match/match.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { MatchModel, type MatchDoc } from '../models/match.model.js';

function toSnapshot(d: MatchDoc): MatchSnapshot {
  const { _id, ...rest } = d;
  return { id: _id, ...rest };
}

@injectable()
export class MongoMatchRepository implements IMatchRepository {
  async save(match: Match): Promise<void> {
    const { id, ...rest } = match.snapshot;
    await MatchModel.updateOne({ _id: id }, { $set: { _id: id, ...rest } }, { upsert: true });
  }

  async findById(id: Id): Promise<Match | null> {
    const doc = await MatchModel.findById(id).lean<MatchDoc>();
    return doc ? Match.rehydrate(toSnapshot(doc)) : null;
  }

  async findByPair(lostId: Id, foundId: Id): Promise<Match | null> {
    const doc = await MatchModel.findOne({ lostItemId: lostId, foundItemId: foundId }).lean<MatchDoc>();
    return doc ? Match.rehydrate(toSnapshot(doc)) : null;
  }

  async listForItem(itemId: Id): Promise<Match[]> {
    const docs = await MatchModel.find({ $or: [{ lostItemId: itemId }, { foundItemId: itemId }] })
      .sort({ score: -1, createdAt: -1 })
      .lean<MatchDoc[]>();
    return docs.map((d) => Match.rehydrate(toSnapshot(d)));
  }

  async count(): Promise<{ total: number; accepted: number }> {
    const [total, accepted] = await Promise.all([
      MatchModel.countDocuments({}),
      MatchModel.countDocuments({ status: { $in: ['accepted', 'verified'] } }),
    ]);
    return { total, accepted };
  }

  async countPerDay(since: Date): Promise<{ date: string; count: number }[]> {
    const rows = await MatchModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({ date: r._id, count: r.count }));
  }
}
