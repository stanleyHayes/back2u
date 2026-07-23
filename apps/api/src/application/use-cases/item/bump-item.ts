import type { ItemDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { WriteAuditLogUseCase } from '../audit/audit.use-cases.js';
import { toItemDTO } from '../mappers/item.mapper.js';

@injectable()
export class BumpItemUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(WriteAuditLogUseCase) private readonly audit: WriteAuditLogUseCase,
  ) {}

  // Routes call this either as execute(userId, itemId) or execute(itemId, userId);
  // the args are indistinguishable statically, so resolve by lookup.
  async execute(a: Id, b: Id): Promise<ItemDTO> {
    let item = await this.items.findById(a);
    const itemId = item ? a : b;
    const userId = item ? b : a;
    if (!item) item = await this.items.findById(b);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.postedById !== userId) throw new ForbiddenError('Not your item');

    item.bump();
    await this.items.save(item);
    await this.audit.execute({
      actorId: userId,
      action: 'item.bump',
      entity: 'item',
      entityId: item.id,
    });
    return toItemDTO(item);
  }
}
