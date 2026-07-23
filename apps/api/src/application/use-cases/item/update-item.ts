import type { ItemDTO, UpdateItemInput } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import type { ItemSnapshot } from '../../../domain/item/item.entity.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IItemRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';
import { WriteAuditLogUseCase } from '../audit/audit.use-cases.js';
import { toItemDTO } from '../mappers/item.mapper.js';

@injectable()
export class UpdateItemUseCase {
  constructor(
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(WriteAuditLogUseCase) private readonly audit: WriteAuditLogUseCase,
  ) {}

  // Routes call this either as execute(itemId, input, userId) or execute(userId, itemId, input).
  async execute(itemId: Id, input: UpdateItemInput, userId: Id): Promise<ItemDTO>;
  async execute(userId: Id, itemId: Id, input: UpdateItemInput): Promise<ItemDTO>;
  async execute(a: Id, b: Id | UpdateItemInput, c: Id | UpdateItemInput): Promise<ItemDTO> {
    const itemId = typeof b === 'string' ? b : a;
    const userId = typeof b === 'string' ? a : (c as Id);
    const input = (typeof b === 'string' ? c : b) as UpdateItemInput;
    const item = await this.items.findById(itemId);
    if (!item) throw new NotFoundError('Item');
    if (item.snapshot.postedById !== userId) throw new ForbiddenError('Not your item');

    if (input.status && input.status !== item.snapshot.status) {
      switch (input.status) {
        case 'closed':
          item.close();
          break;
        case 'returned':
          item.markReturned();
          break;
        case 'claimed':
          item.markClaimed();
          break;
        case 'archived':
          item.archive();
          break;
        default:
          throw new ValidationError(`Cannot set status to ${input.status}`);
      }
    }

    const patch: Partial<
      Pick<ItemSnapshot, 'title' | 'description' | 'category' | 'tags' | 'classification'>
    > = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.category !== undefined) patch.category = input.category;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.classification !== undefined) patch.classification = input.classification;
    item.update(patch);

    await this.items.save(item);
    await this.audit.execute({
      actorId: userId,
      action: 'item.update',
      entity: 'item',
      entityId: item.id,
      meta: { fields: Object.keys(patch), status: input.status },
    });
    return toItemDTO(item);
  }
}
