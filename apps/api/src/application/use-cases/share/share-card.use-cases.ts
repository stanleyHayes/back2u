import type { SocialShareCardDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IAppUrls } from '../../ports/extra-services.js';
import type { IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class GetShareCardUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.AppUrls) private readonly appUrls: IAppUrls,
  ) {}

  // Routes call this either as execute(itemId) or execute(itemId, apiPublicUrl).
  async execute(itemId: Id): Promise<SocialShareCardDTO>;
  async execute(itemId: Id, apiPublicUrl: string): Promise<SocialShareCardDTO>;
  async execute(itemId: Id, apiPublicUrl?: string): Promise<SocialShareCardDTO> {
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');
    const s = item.snapshot;
    const verb = s.kind === 'lost' ? 'Lost' : 'Found';
    return {
      itemId: s.id,
      url: apiPublicUrl
        ? `${apiPublicUrl.replace(/\/$/, '')}/v1/share/items/${s.id}`
        : this.appUrls.itemDetail(s.id),
      imageUrl: s.images[0]?.url ?? '',
      message: `${verb}: ${s.title} — ${s.place.name}. Help reunite it with its owner on Back2u.`,
    };
  }
}
