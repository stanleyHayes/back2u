import { inject, injectable } from 'inversify';

import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IMessageRepository, IThreadRepository } from '../../ports/repositories.js';
import type { IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class MarkMessageReadUseCase {
  constructor(
    @inject(TOKENS.ThreadRepository) private readonly threads: IThreadRepository,
    @inject(TOKENS.MessageRepository) private readonly messages: IMessageRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
  ) {}

  async execute(userId: Id, threadId: Id, messageId: Id): Promise<{ ok: true }> {
    const thread = await this.threads.findById(threadId);
    if (!thread) throw new NotFoundError('Thread');
    if (!thread.hasParticipant(userId)) throw new ForbiddenError();
    const message = await this.messages.findById(messageId);
    if (!message || message.snapshot.threadId !== threadId) throw new NotFoundError('Message');
    await this.messages.markMessageRead(messageId, userId);
    this.bus.publishToThread(threadId, 'chat:read', { threadId, messageId, userId });
    return { ok: true };
  }
}
