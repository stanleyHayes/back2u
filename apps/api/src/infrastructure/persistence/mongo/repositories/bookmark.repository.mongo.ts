import { injectable } from 'inversify';

import type { IBookmarkRepository } from '../../../../application/ports/repositories.js';
import { Bookmark, type BookmarkSnapshot } from '../../../../domain/bookmark/bookmark.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { BookmarkModel, type BookmarkDoc } from '../models/bookmark.model.js';

function toSnapshot(d: BookmarkDoc): BookmarkSnapshot {
  const { _id, ...rest } = d;
  return { id: _id, ...rest };
}

@injectable()
export class MongoBookmarkRepository implements IBookmarkRepository {
  async save(bookmark: Bookmark): Promise<void> {
    const { id, ...rest } = bookmark.snapshot;
    await BookmarkModel.updateOne({ _id: id }, { $set: { _id: id, ...rest } }, { upsert: true });
  }

  async findByUserAndItem(userId: Id, itemId: Id): Promise<Bookmark | null> {
    const doc = await BookmarkModel.findOne({ userId, itemId }).lean<BookmarkDoc>();
    return doc ? Bookmark.rehydrate(toSnapshot(doc)) : null;
  }

  async delete(userId: Id, itemId: Id): Promise<void> {
    await BookmarkModel.deleteOne({ userId, itemId });
  }

  async listForUser(userId: Id): Promise<Bookmark[]> {
    const docs = await BookmarkModel.find({ userId }).sort({ createdAt: -1 }).lean<BookmarkDoc[]>();
    return docs.map((d) => Bookmark.rehydrate(toSnapshot(d)));
  }

  async countByItemId(itemId: Id): Promise<number> {
    return BookmarkModel.countDocuments({ itemId });
  }

  async countByItemIds(itemIds: Id[]): Promise<Record<Id, number>> {
    if (itemIds.length === 0) return {};
    const rows = await BookmarkModel.aggregate<{ _id: string; count: number }>([
      { $match: { itemId: { $in: itemIds } } },
      { $group: { _id: '$itemId', count: { $sum: 1 } } },
    ]);
    const out: Record<Id, number> = {};
    for (const r of rows) out[r._id] = r.count;
    return out;
  }
}
