import type { MatchDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IItemRepository, IMatchRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { toMatchDTO } from './generate-matches.js';

@injectable()
export class ListMatchesForItemUseCase {
  constructor(
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
  ) {}

  async execute(itemId: Id, userId: Id): Promise<MatchDTO[]> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.postedById !== userId) throw new ForbiddenError('Not the item owner');

    const list = await this.matches.listForItem(itemId);
    return list.sort((a, b) => b.snapshot.score - a.snapshot.score).map(toMatchDTO);
  }
}
