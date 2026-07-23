import type { ItemDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { WriteAuditLogUseCase } from '../audit/audit.use-cases.js';
import { toItemDTO } from '../mappers/item.mapper.js';

@injectable()
export class ClearItemReviewFlagUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(WriteAuditLogUseCase) private readonly audit: WriteAuditLogUseCase,
  ) {}

  // Routes call this either as execute(itemId) or execute(actorId, itemId).
  async execute(itemId: Id): Promise<ItemDTO>;
  async execute(actorId: Id, itemId: Id): Promise<ItemDTO>;
  async execute(a: Id, b?: Id): Promise<ItemDTO> {
    const itemId = b ?? a;
    const actorId = b ? a : undefined;
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');

    item.clearReviewFlag();
    await this.items.save(item);
    await this.audit.execute({
      actorId,
      action: 'item.clearReviewFlag',
      entity: 'item',
      entityId: item.id,
    });
    return toItemDTO(item);
  }
}
