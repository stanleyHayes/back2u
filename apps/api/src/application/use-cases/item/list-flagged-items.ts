import type { ItemDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { toItemDTO } from '../mappers/item.mapper.js';

@injectable()
export class ListFlaggedItemsUseCase {
  constructor(@inject(TOKENS.ItemRepository) private readonly items: IItemRepository) {}

  async execute(limit = 50): Promise<ItemDTO[]> {
    const items = await this.items.findFlaggedForReview(limit);
    return items.map((item) => toItemDTO(item));
  }
}
