import type { AutocompleteResult } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class AutocompleteSearchUseCase {
  constructor(@inject(TOKENS.ItemRepository) private readonly items: IItemRepository) {}

  async execute(prefix: string): Promise<AutocompleteResult> {
    return this.items.autocomplete(prefix);
  }
}
