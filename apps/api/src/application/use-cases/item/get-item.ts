import type { ItemDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IBookmarkRepository, IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { toItemDTO } from '../mappers/item.mapper.js';

@injectable()
export class GetItemUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.BookmarkRepository) private readonly bookmarks: IBookmarkRepository,
  ) {}

  async execute(id: Id): Promise<ItemDTO> {
    const item = await this.items.findById(id);
    if (!item) throw new NotFoundError('Item');
    const bookmarkCount = await this.bookmarks.countByItemId(id);
    return toItemDTO(item, { bookmarkCount });
  }
}
