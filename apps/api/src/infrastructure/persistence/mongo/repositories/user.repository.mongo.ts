import { injectable } from 'inversify';

import type { IUserRepository } from '../../../../application/ports/repositories.js';
import type { Id } from '../../../../domain/shared/id.js';
import { User, type UserSnapshot } from '../../../../domain/user/user.entity.js';
import { UserModel } from '../models/user.model.js';

type UserDoc = Omit<UserSnapshot, 'id'> & { _id: unknown };

const toSnapshot = (d: UserDoc): UserSnapshot => {
  const { _id, ...rest } = d;
  return { ...rest, id: String(_id) };
};

@injectable()
export class MongoUserRepository implements IUserRepository {
  /**
   * Persists the user, deliberately EXCLUDING `pointsBalance`.
   *
   * This is a whole-document write, so including the balance would silently
   * revert any concurrent `$inc` — the clearing job, a reversal, or a
   * redemption running between this caller's read and its write. Keeping the
   * field out makes {@link incrementPoints} the only way the balance can move,
   * which is the invariant the ledger depends on. A brand-new user still gets
   * their opening balance through `$setOnInsert`.
   */
  async save(user: User): Promise<void> {
    const { id, pointsBalance, ...rest } = user.snapshot;
    await UserModel.updateOne(
      { _id: id },
      { $set: rest, $setOnInsert: { _id: id, pointsBalance } },
      { upsert: true },
    );
  }

  async incrementPoints(userId: Id, points: number, reputationDelta = 0): Promise<void> {
    const inc: Record<string, number> = { pointsBalance: points };
    if (reputationDelta !== 0) inc.reputationScore = reputationDelta;
    await UserModel.updateOne({ _id: userId }, { $inc: inc, $set: { updatedAt: new Date() } });
  }

  async findById(id: Id): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<UserDoc>();
    return doc ? User.rehydrate(toSnapshot(doc)) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).lean<UserDoc>();
    return doc ? User.rehydrate(toSnapshot(doc)) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const doc = await UserModel.findOne({ phone }).lean<UserDoc>();
    return doc ? User.rehydrate(toSnapshot(doc)) : null;
  }

  async topByPoints(limit: number): Promise<User[]> {
    const docs = await UserModel.find({})
      .sort({ pointsBalance: -1, createdAt: 1 })
      .limit(limit)
      .lean<UserDoc[]>();
    return docs.map((d) => User.rehydrate(toSnapshot(d)));
  }

  async list(filter: { limit?: number; offset?: number; search?: string }): Promise<User[]> {
    const q: Record<string, unknown> = {};
    if (filter.search) {
      const regex = { $regex: filter.search, $options: 'i' };
      q.$or = [{ name: regex }, { email: regex }];
    }
    let query = UserModel.find(q).sort({ createdAt: -1 });
    if (filter.offset) query = query.skip(filter.offset);
    if (filter.limit) query = query.limit(filter.limit);
    const docs = await query.lean<UserDoc[]>();
    return docs.map((d) => User.rehydrate(toSnapshot(d)));
  }

  async count(): Promise<number> {
    return UserModel.countDocuments({});
  }

  async countPerDay(since: Date): Promise<{ date: string; count: number }[]> {
    const rows = await UserModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({ date: r._id, count: r.count }));
  }
}
