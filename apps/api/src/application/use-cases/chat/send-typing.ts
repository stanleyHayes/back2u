import { inject, injectable } from 'inversify';

import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IThreadRepository } from '../../ports/repositories.js';
import type { IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

@injectable()
export class SendTypingUseCase {
  constructor(
    @inject(TOKENS.ThreadRepository) private readonly threads: IThreadRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
  ) {}

  async execute(userId: Id, threadId: Id, typing: boolean): Promise<{ ok: true }> {
    const thread = await this.threads.findById(threadId);
    if (!thread) throw new NotFoundError('Thread');
    if (!thread.hasParticipant(userId)) throw new ForbiddenError();
    this.bus.publishToThread(threadId, 'chat:typing', { threadId, userId, typing });
    return { ok: true };
  }
}
