import { inject, injectable } from 'inversify';

import type { ChatMessageDTO, ChatThreadDTO } from '@back2u/shared-types';

import type { Message } from '../../../domain/chat/message.entity.js';
import type { Thread } from '../../../domain/chat/thread.entity.js';
import { ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type { IMessageRepository, IThreadRepository } from '../../ports/repositories.js';
import { TOKENS } from '../../ports/tokens.js';

export function toThreadDTO(t: Thread): ChatThreadDTO {
  const s = t.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    matchId: s.matchId,
    participantIds: [...s.participantIds],
    lastMessageAt: s.lastMessageAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

export function toMessageDTO(m: Message): ChatMessageDTO {
  const s = m.snapshot;
  return {
    id: s.id,
    threadId: s.threadId,
    authorId: s.authorId,
    body: s.body,
    flagged: s.flagged,
    readBy: [...s.readBy],
    images: s.images.map((i) => ({ url: i.url })),
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class ListThreadsUseCase {
  constructor(@inject(TOKENS.ThreadRepository) private readonly threads: IThreadRepository) {}

  async execute(userId: Id): Promise<ChatThreadDTO[]> {
    const list = await this.threads.findForUser(userId);
    return list.map(toThreadDTO);
  }
}

@injectable()
export class GetMessagesUseCase {
  constructor(
    @inject(TOKENS.ThreadRepository) private readonly threads: IThreadRepository,
    @inject(TOKENS.MessageRepository) private readonly messages: IMessageRepository,
  ) {}

  async execute(userId: Id, threadId: Id, limit = 100): Promise<ChatMessageDTO[]> {
    const thread = await this.threads.findById(threadId);
    if (!thread) throw new NotFoundError('Thread');
    if (!thread.hasParticipant(userId)) throw new ForbiddenError();
    const list = await this.messages.listForThread(threadId, limit);
    return list.map(toMessageDTO);
  }
}
