import type { BookmarkDTO, ItemDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { Bookmark } from '../../../domain/bookmark/bookmark.entity.js';
import type { Item } from '../../../domain/item/item.entity.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IBookmarkRepository, IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toItemDTO(item: Item): ItemDTO {
  const s = item.snapshot;
  return {
    id: s.id,
    kind: s.kind,
    classification: s.classification,
    status: s.status,
    title: s.title,
    description: s.description,
    category: s.category,
    tags: s.tags,
    images: s.images,
    place: s.place,
    occurredAt: s.occurredAt.toISOString(),
    postedById: s.postedById,
    rewardId: s.rewardId,
    institutionId: s.institutionId,
    qrTagCode: s.qrTagCode,
    perceptualHash: s.perceptualHash,
    duplicateOfId: s.duplicateOfId,
    policeCaseId: s.policeCaseId,
    serialNumber: s.serialNumber,
    imei: s.imei,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    expiresAt: s.expiresAt?.toISOString(),
    bumpedAt: s.bumpedAt?.toISOString(),
    flaggedForReview: s.flaggedForReview,
  };
}

function toBookmarkDTO(b: Bookmark, item: Item | null): BookmarkDTO {
  const s = b.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    itemId: s.itemId,
    item: item ? toItemDTO(item) : null,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class BookmarkItemUseCase {
  constructor(
    @inject(TOKENS.BookmarkRepository) private readonly bookmarks: IBookmarkRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}
  async execute(userId: Id, itemId: Id): Promise<BookmarkDTO> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');
    const existing = await this.bookmarks.findByUserAndItem(userId, itemId);
    if (existing) return toBookmarkDTO(existing, item);
    const bookmark = Bookmark.create({ id: newId(), userId, itemId });
    await this.bookmarks.save(bookmark);
    return toBookmarkDTO(bookmark, item);
  }
}

@injectable()
export class UnbookmarkItemUseCase {
  constructor(@inject(TOKENS.BookmarkRepository) private readonly bookmarks: IBookmarkRepository) {}
  async execute(userId: Id, itemId: Id): Promise<{ deleted: true }> {
    await this.bookmarks.delete(userId, itemId);
    return { deleted: true };
  }
}

@injectable()
export class ListMyBookmarksUseCase {
  constructor(
    @inject(TOKENS.BookmarkRepository) private readonly bookmarks: IBookmarkRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}
  async execute(userId: Id): Promise<BookmarkDTO[]> {
    const list = await this.bookmarks.listForUser(userId);
    const items = await this.items.findByIds(list.map((b) => b.snapshot.itemId));
    const byId = new Map(items.map((i) => [i.id, i]));
    return list.map((b) => toBookmarkDTO(b, byId.get(b.snapshot.itemId) ?? null));
  }
}
