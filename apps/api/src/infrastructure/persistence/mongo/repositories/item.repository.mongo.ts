import { injectable } from 'inversify';

import type { ItemKind } from '@back2u/shared-types';

import type { IItemRepository, ItemListFilter } from '../../../../application/ports/repositories.js';
import { Item, type ItemSnapshot } from '../../../../domain/item/item.entity.js';
import type { Id } from '../../../../domain/shared/id.js';
import { ItemModel, type ItemDoc } from '../models/item.model.js';

function toSnapshot(d: ItemDoc): ItemSnapshot {
  const { _id, ...rest } = d;
  return { id: _id, ...rest };
}

function toDoc(s: ItemSnapshot): ItemDoc {
  const { id, ...rest } = s;
  return { _id: id, ...rest };
}

function escapeRegex(v: string): string {
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hexHamming(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let dist = Math.abs(a.length - b.length) * 4;
  for (let i = 0; i < len; i++) {
    const x = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16);
    if (Number.isNaN(x)) return Number.MAX_SAFE_INTEGER;
    dist += ((x & 8) ? 1 : 0) + ((x & 4) ? 1 : 0) + ((x & 2) ? 1 : 0) + ((x & 1) ? 1 : 0);
  }
  return dist;
}

@injectable()
export class MongoItemRepository implements IItemRepository {
  async save(item: Item): Promise<void> {
    const doc = toDoc(item.snapshot);
    await ItemModel.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
  }

  async findById(id: Id): Promise<Item | null> {
    const doc = await ItemModel.findById(id).lean<ItemDoc>();
    return doc ? Item.rehydrate(toSnapshot(doc)) : null;
  }

  async findByIds(ids: Id[]): Promise<Item[]> {
    if (ids.length === 0) return [];
    const docs = await ItemModel.find({ _id: { $in: ids } }).lean<ItemDoc[]>();
    return docs.map((d) => Item.rehydrate(toSnapshot(d)));
  }

  async list(filter: ItemListFilter): Promise<{ items: Item[]; total: number }> {
    const q: Record<string, unknown> = {};
    if (filter.kind) q.kind = filter.kind;
    if (filter.status) q.status = filter.status;
    if (filter.category) q.category = filter.category;
    if (filter.postedById) q.postedById = filter.postedById;
    if (filter.institutionId) q.institutionId = filter.institutionId;
    if (filter.text) q.$text = { $search: filter.text };
    if (filter.search) {
      const regex = { $regex: escapeRegex(filter.search), $options: 'i' };
      q.$or = [{ title: regex }, { description: regex }];
    }
    if (filter.city) q['place.city'] = filter.city;
    if (filter.dateFrom || filter.dateTo) {
      q.createdAt = {};
      if (filter.dateFrom) (q.createdAt as Record<string, Date>).$gte = filter.dateFrom;
      if (filter.dateTo) (q.createdAt as Record<string, Date>).$lte = filter.dateTo;
    }
    if (filter.near) {
      q['place.point'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [filter.near.lng, filter.near.lat] },
          $maxDistance: filter.near.radiusMeters,
        },
      };
    }
    if (filter.cursor) {
      const last = new Date(filter.cursor.lastCreatedAt);
      q.$and = [
        {
          $or: [
            { createdAt: { $lt: last } },
            { createdAt: last, _id: { $lt: filter.cursor.lastId } },
          ],
        },
      ];
    }

    const total = await ItemModel.countDocuments(q);
    let query = ItemModel.find(q).sort({ createdAt: -1, _id: -1 });
    if (!filter.cursor) query = query.skip((filter.page - 1) * filter.pageSize);
    const docs = await query.limit(filter.pageSize).lean<ItemDoc[]>();

    return { items: docs.map((d) => Item.rehydrate(toSnapshot(d))), total };
  }

  async findCandidatesFor(
    item: Item,
    opts: { radiusMeters: number; daysWindow: number; limit: number },
  ): Promise<Item[]> {
    const s = item.snapshot;
    const opposite: ItemKind = s.kind === 'lost' ? 'found' : 'lost';
    const windowMs = opts.daysWindow * 86_400_000;
    const docs = await ItemModel.find({
      _id: { $ne: s.id },
      kind: opposite,
      status: 'open',
      category: s.category,
      occurredAt: {
        $gte: new Date(s.occurredAt.getTime() - windowMs),
        $lte: new Date(s.occurredAt.getTime() + windowMs),
      },
      'place.point': {
        $near: {
          $geometry: { type: 'Point', coordinates: s.place.point.coordinates },
          $maxDistance: opts.radiusMeters,
        },
      },
    })
      .limit(opts.limit)
      .lean<ItemDoc[]>();
    return docs.map((d) => Item.rehydrate(toSnapshot(d)));
  }

  async findByPerceptualHash(hash: string, threshold: number): Promise<Item[]> {
    const docs = await ItemModel.find({ perceptualHash: { $exists: true, $ne: null } })
      .limit(1000)
      .lean<ItemDoc[]>();
    return docs
      .filter((d) => d.perceptualHash && hexHamming(d.perceptualHash, hash) <= threshold)
      .map((d) => Item.rehydrate(toSnapshot(d)));
  }

  async findOlderThanReturned(beforeDate: Date): Promise<Item[]> {
    const docs = await ItemModel.find({ status: 'returned', updatedAt: { $lte: beforeDate } })
      .limit(500)
      .lean<ItemDoc[]>();
    return docs.map((d) => Item.rehydrate(toSnapshot(d)));
  }

  async findByQrTagCode(code: string): Promise<Item | null> {
    const doc = await ItemModel.findOne({ qrTagCode: code }).lean<ItemDoc>();
    return doc ? Item.rehydrate(toSnapshot(doc)) : null;
  }

  async findInPolygon(coordinates: number[][][], opts: { sinceDays: number }): Promise<Item[]> {
    const since = new Date(Date.now() - opts.sinceDays * 86_400_000);
    const docs = await ItemModel.find({
      createdAt: { $gte: since },
      'place.point': {
        $geoWithin: { $geometry: { type: 'Polygon', coordinates } },
      },
    })
      .limit(500)
      .lean<ItemDoc[]>();
    return docs.map((d) => Item.rehydrate(toSnapshot(d)));
  }

  private async countGrouped(field: string): Promise<Record<string, number>> {
    const rows = await ItemModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ]);
    const out: Record<string, number> = {};
    for (const r of rows) if (r._id) out[r._id] = r.count;
    return out;
  }

  countByStatus(): Promise<Record<string, number>> {
    return this.countGrouped('status');
  }

  countByKind(): Promise<Record<string, number>> {
    return this.countGrouped('kind');
  }

  countByCategory(): Promise<Record<string, number>> {
    return this.countGrouped('category');
  }

  async countPerDay(since: Date): Promise<{ date: string; count: number }[]> {
    const rows = await ItemModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({ date: r._id, count: r.count }));
  }

  async autocomplete(prefix: string): Promise<{ cities: string[]; categories: string[] }> {
    const regex = { $regex: `^${escapeRegex(prefix)}`, $options: 'i' };
    const [cities, categories] = await Promise.all([
      ItemModel.distinct('place.city', { 'place.city': regex }),
      ItemModel.distinct('category', { category: regex }),
    ]);
    const clean = (vals: string[]) => vals.filter((v): v is string => typeof v === 'string' && v.length > 0).slice(0, 10);
    return { cities: clean(cities as string[]), categories: clean(categories as string[]) };
  }

  async findFlaggedForReview(limit: number): Promise<Item[]> {
    const docs = await ItemModel.find({ flaggedForReview: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<ItemDoc[]>();
    return docs.map((d) => Item.rehydrate(toSnapshot(d)));
  }

  async findRecentByKindAndCategory(
    kind: ItemKind,
    category: string,
    since: Date,
    limit: number,
  ): Promise<Item[]> {
    const docs = await ItemModel.find({ kind, category, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<ItemDoc[]>();
    return docs.map((d) => Item.rehydrate(toSnapshot(d)));
  }

  async countByInstitution(institutionId: Id): Promise<{ total: number; byStatus: Record<string, number> }> {
    const [total, rows] = await Promise.all([
      ItemModel.countDocuments({ institutionId }),
      ItemModel.aggregate<{ _id: string; count: number }>([
        { $match: { institutionId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    const byStatus: Record<string, number> = {};
    for (const r of rows) if (r._id) byStatus[r._id] = r.count;
    return { total, byStatus };
  }

  async listRecentByInstitution(institutionId: Id, limit: number): Promise<Item[]> {
    const docs = await ItemModel.find({ institutionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<ItemDoc[]>();
    return docs.map((d) => Item.rehydrate(toSnapshot(d)));
  }
}
