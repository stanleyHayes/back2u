import { inject, injectable } from 'inversify';

import type { ModerationQueueItemDTO } from '@back2u/shared-types';

import type { ModerationQueueItem } from '../../../domain/moderation/moderation-queue-item.entity.js';
import { ConflictError, NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IModerationQueueRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(item: ModerationQueueItem): ModerationQueueItemDTO {
  const s = item.snapshot;
  return {
    id: s.id,
    type: s.type,
    targetId: s.targetId,
    reason: s.reason,
    status: s.status,
    score: s.score,
    createdAt: s.createdAt.toISOString(),
    reviewedAt: s.reviewedAt?.toISOString(),
    reviewerId: s.reviewerId,
    reviewerDecision: s.reviewerDecision,
  };
}

@injectable()
export class ListModerationQueueUseCase {
  constructor(@inject(TOKENS.ModerationQueueRepository) private readonly queue: IModerationQueueRepository) {}

  async execute(filter: { type?: string; status?: string; limit?: number }): Promise<ModerationQueueItemDTO[]> {
    const list = await this.queue.list({ type: filter.type, status: filter.status, limit: filter.limit ?? 100 });
    return list.map(toDTO);
  }
}

@injectable()
export class ReviewModerationItemUseCase {
  constructor(@inject(TOKENS.ModerationQueueRepository) private readonly queue: IModerationQueueRepository) {}

  async execute(reviewerId: Id, itemId: Id, decision: 'approve' | 'remove'): Promise<{ ok: true }> {
    const item = await this.queue.findById(itemId);
    if (!item) throw new NotFoundError('Moderation queue item');
    if (item.snapshot.status !== 'pending') throw new ConflictError('Already reviewed');
    item.review(reviewerId, decision);
    await this.queue.save(item);
    return { ok: true };
  }
}
