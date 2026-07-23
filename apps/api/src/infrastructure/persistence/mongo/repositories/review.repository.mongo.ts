import { injectable } from 'inversify';

import type { IReviewRepository } from '../../../../application/ports/repositories.js';
import { Review, type ReviewSnapshot } from '../../../../domain/review/review.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { ReviewModel, type ReviewDoc } from '../models/review.model.js';

function toSnapshot(d: ReviewDoc): ReviewSnapshot {
  const { _id, ...rest } = d;
  return { id: _id, ...rest };
}

@injectable()
export class MongoReviewRepository implements IReviewRepository {
  async save(review: Review): Promise<void> {
    const { id, ...rest } = review.snapshot;
    await ReviewModel.updateOne({ _id: id }, { $set: { _id: id, ...rest } }, { upsert: true });
  }

  async findById(id: Id): Promise<Review | null> {
    const doc = await ReviewModel.findById(id).lean<ReviewDoc>();
    return doc ? Review.rehydrate(toSnapshot(doc)) : null;
  }

  async findByReviewerAndMatch(reviewerId: Id, matchId: Id): Promise<Review | null> {
    const doc = await ReviewModel.findOne({ reviewerId, matchId }).lean<ReviewDoc>();
    return doc ? Review.rehydrate(toSnapshot(doc)) : null;
  }

  async listForReviewee(revieweeId: Id, opts?: { limit?: number }): Promise<Review[]> {
    const docs = await ReviewModel.find({ revieweeId })
      .sort({ createdAt: -1 })
      .limit(opts?.limit ?? 50)
      .lean<ReviewDoc[]>();
    return docs.map((d) => Review.rehydrate(toSnapshot(d)));
  }

  async countAndAverageForUser(userId: Id): Promise<{ count: number; average: number }> {
    const rows = await ReviewModel.aggregate<{ _id: string; count: number; average: number }>([
      { $match: { revieweeId: userId } },
      { $group: { _id: '$revieweeId', count: { $sum: 1 }, average: { $avg: '$rating' } } },
    ]);
    const row = rows[0];
    if (!row) return { count: 0, average: 0 };
    return { count: row.count, average: Number(row.average.toFixed(2)) };
  }
}
