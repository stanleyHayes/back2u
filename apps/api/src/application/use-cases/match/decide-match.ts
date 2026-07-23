import type { MatchDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { Thread } from '../../../domain/chat/thread.entity.js';
import type { Item } from '../../../domain/item/item.entity.js';
import type { Match } from '../../../domain/match/match.entity.js';
import { Notification } from '../../../domain/notification/notification.entity.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IAppUrls } from '../../ports/extra-services.js';
import type {
  IAuditLogRepository,
  IItemRepository,
  IMatchRepository,
  INotificationRepository,
  IThreadRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { IEmailService, IPushService, IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { toMatchDTO } from './generate-matches.js';

interface MatchContext {
  match: Match;
  lost: Item;
  found: Item;
  participants: Id[];
}

@injectable()
export class AcceptMatchUseCase {
  constructor(
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.ThreadRepository) private readonly threads: IThreadRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.PushService) private readonly push: IPushService,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.AppUrls) private readonly urls: IAppUrls,
  ) {}

  async execute(matchId: Id, userId: Id): Promise<MatchDTO> {
    const ctx = await this.load(matchId, userId);
    const { match, lost, found, participants } = ctx;
    if (match.snapshot.status !== 'suggested') {
      throw new ConflictError(`Match already ${match.snapshot.status}`);
    }

    match.accept();
    lost.markMatched();
    found.markMatched();
    await Promise.all([this.matches.save(match), this.items.save(lost), this.items.save(found)]);

    // Open (or reuse) the chat thread between both posters.
    let thread = await this.threads.findByItemAndParticipants(lost.id, participants);
    if (!thread) {
      thread = Thread.open({
        id: newId(),
        itemId: lost.id,
        matchId: match.snapshot.id,
        participantIds: participants,
      });
      await this.threads.save(thread);
    }

    const otherId = participants.find((p) => p !== userId)!;
    const title = 'Match accepted';
    const body = `Your match for "${lost.snapshot.title}" was accepted — you can now chat.`;
    const data = { matchId: match.snapshot.id, threadId: thread.snapshot.id, itemTitle: lost.snapshot.title };
    await this.notifications.save(
      Notification.create({ id: newId(), userId: otherId, type: 'match', title, body, data, url: this.urls.matches() }),
    );
    this.bus.publishToUser(otherId, 'match:accepted', data);

    const other = await this.users.findById(otherId);
    if (other) {
      void this.email
        .sendChatNotification(other.email, other.snapshot.name, this.urls.matches(), other.snapshot.locale)
        .catch(() => {});
      if (other.snapshot.pushTokens.length > 0) {
        void this.push.send(other.snapshot.pushTokens, title, body, data).catch(() => {});
      }
    }

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId: userId,
        action: 'match.accept',
        entity: 'match',
        entityId: match.snapshot.id,
        meta: { threadId: thread.snapshot.id },
      }),
    );

    return toMatchDTO(match);
  }

  private async load(matchId: Id, userId: Id): Promise<MatchContext> {
    const match = await this.matches.findById(matchId);
    if (!match) throw new NotFoundError('Match');
    const lost = await this.items.findById(match.snapshot.lostItemId);
    const found = await this.items.findById(match.snapshot.foundItemId);
    if (!lost || !found) throw new NotFoundError('Item');
    const participants = [lost.snapshot.postedById, found.snapshot.postedById];
    if (!participants.includes(userId)) throw new ForbiddenError('Not a match participant');
    return { match, lost, found, participants };
  }
}

@injectable()
export class RejectMatchUseCase {
  constructor(
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
  ) {}

  async execute(matchId: Id, userId: Id): Promise<MatchDTO> {
    const match = await this.matches.findById(matchId);
    if (!match) throw new NotFoundError('Match');
    const lost = await this.items.findById(match.snapshot.lostItemId);
    const found = await this.items.findById(match.snapshot.foundItemId);
    if (!lost || !found) throw new NotFoundError('Item');
    const participants = [lost.snapshot.postedById, found.snapshot.postedById];
    if (!participants.includes(userId)) throw new ForbiddenError('Not a match participant');
    if (match.snapshot.status !== 'suggested') {
      throw new ConflictError(`Match already ${match.snapshot.status}`);
    }

    match.reject();
    await this.matches.save(match);

    const otherId = participants.find((p) => p !== userId)!;
    const data = { matchId: match.snapshot.id, itemTitle: lost.snapshot.title };
    await this.notifications.save(
      Notification.create({
        id: newId(),
        userId: otherId,
        type: 'match',
        title: 'Match rejected',
        body: `The suggested match for "${lost.snapshot.title}" was rejected.`,
        data,
      }),
    );
    this.bus.publishToUser(otherId, 'match:rejected', data);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId: userId,
        action: 'match.reject',
        entity: 'match',
        entityId: match.snapshot.id,
      }),
    );

    return toMatchDTO(match);
  }
}
