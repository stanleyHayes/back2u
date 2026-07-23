import { inject, injectable } from 'inversify';

import type { ChatMessageDTO } from '@back2u/shared-types';

import { Message } from '../../../domain/chat/message.entity.js';
import { ModerationQueueItem } from '../../../domain/moderation/moderation-queue-item.entity.js';
import { Notification } from '../../../domain/notification/notification.entity.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IAppUrls } from '../../ports/extra-services.js';
import type {
  IItemRepository,
  IMessageRepository,
  IModerationQueueRepository,
  INotificationRepository,
  IThreadRepository,
  IVerificationRepository,
} from '../../ports/repositories.js';
import type { IBlockRepository } from '../../ports/safety-repos.js';
import type { IContentModeration, IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { toMessageDTO } from './list-threads.js';

const MAX_IMAGES = 3;

const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/gi;
const URL_RE = /(?:https?:\/\/|www\.)\S+/gi;

function redactPii(body: string): string {
  let out = body;
  for (const [re, label] of [
    [PHONE_RE, 'phone'],
    [EMAIL_RE, 'email'],
    [URL_RE, 'url'],
  ] as const) {
    out = out.replace(re, `[${label} removed]`);
  }
  return out;
}

@injectable()
export class PostMessageUseCase {
  constructor(
    @inject(TOKENS.ThreadRepository) private readonly threads: IThreadRepository,
    @inject(TOKENS.MessageRepository) private readonly messages: IMessageRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.VerificationRepository) private readonly verifications: IVerificationRepository,
    @inject(TOKENS.BlockRepository) private readonly blocks: IBlockRepository,
    @inject(TOKENS.ModerationQueueRepository) private readonly moderationQueue: IModerationQueueRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.ContentModeration) private readonly moderation: IContentModeration,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.AppUrls) private readonly appUrls: IAppUrls,
  ) {}

  async execute(
    userId: Id,
    input: { threadId: Id; body: string; images?: { url: string }[] },
  ): Promise<ChatMessageDTO> {
    const thread = await this.threads.findById(input.threadId);
    if (!thread) throw new NotFoundError('Thread');
    if (!thread.hasParticipant(userId)) throw new ForbiddenError();

    const body = (input.body ?? '').trim();
    const images = input.images ?? [];
    if (!body && images.length === 0) throw new ValidationError('Message body or images required');
    if (images.length > MAX_IMAGES) throw new ValidationError(`Max ${MAX_IMAGES} images per message`);

    // Chat is gated on verification approval: the claimant (anyone other than the
    // item poster) must hold an approved ownership verification for the item.
    const item = await this.items.findById(thread.snapshot.itemId);
    if (item && item.snapshot.postedById !== userId) {
      const verifications = await this.verifications.listForItem(item.id);
      const approved = verifications.some(
        (v) => v.snapshot.claimantId === userId && v.snapshot.status === 'approved',
      );
      if (!approved) throw new ForbiddenError('Ownership verification required before chatting');
    }

    // Blocklist enforcement in both directions.
    const others = thread.snapshot.participantIds.filter((p) => p !== userId);
    for (const other of others) {
      if ((await this.blocks.exists(other, userId)) || (await this.blocks.exists(userId, other))) {
        throw new ForbiddenError('Messaging is blocked between these users');
      }
    }

    const redacted = redactPii(body);
    const score = await this.moderation.scoreMessage(body);

    const message = Message.post({
      id: newId(),
      threadId: thread.snapshot.id,
      authorId: userId,
      body: redacted,
      flagged: score.flagged,
      images,
    });
    await this.messages.save(message);

    if (score.flagged) {
      await this.moderationQueue.save(
        ModerationQueueItem.create({
          id: newId(),
          type: 'message',
          targetId: message.snapshot.id,
          reason: score.reason ?? 'flagged by content moderation',
          score: 1,
        }),
      );
    }

    thread.touch();
    await this.threads.save(thread);

    const dto = toMessageDTO(message);
    this.bus.publishToThread(thread.snapshot.id, 'message:new', dto);

    for (const other of others) {
      await this.notifications.save(
        Notification.create({
          id: newId(),
          userId: other,
          type: 'message',
          title: 'New message',
          body: redacted ? redacted.slice(0, 140) : 'Sent you an image',
          data: { threadId: thread.snapshot.id },
          url: `${this.appUrls.app()}/chat?thread=${thread.snapshot.id}`,
        }),
      );
    }

    return dto;
  }
}
