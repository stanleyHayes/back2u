import type { ItemDTO, ItemListQuery, Paginated } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { IBookmarkRepository, IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { toItemDTO } from '../mappers/item.mapper.js';

@injectable()
export class ListItemsUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.BookmarkRepository) private readonly bookmarks: IBookmarkRepository,
  ) {}

  async execute(query: ItemListQuery): Promise<Paginated<ItemDTO>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const result = await this.items.list({
      kind: query.kind,
      status: query.status,
      category: query.category,
      text: query.text,
      search: query.search,
      city: query.city,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      near: query.near,
      postedById: query.postedById,
      page,
      pageSize,
    });
    const counts = await this.bookmarks.countByItemIds(result.items.map((i) => i.id));
    return {
      items: result.items.map((item) => toItemDTO(item, { bookmarkCount: counts[item.id] ?? 0 })),
      page,
      pageSize,
      total: result.total,
    };
  }
}
