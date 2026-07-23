import { inject, injectable } from 'inversify';
import type { NotificationDTO } from '@back2u/shared-types';

import { Notification } from '../../../domain/notification/notification.entity.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { INotificationRepository, IUserRepository } from '../../ports/repositories.js';
import type { IEmailService, ILogger } from '../../ports/services.js';
import type { IWebPushService } from '../../ports/extra-services.js';
import type { IWebPushSubscriptionRepository } from '../../../infrastructure/persistence/mongo/repositories/web-push.repo.mongo.js';
import { TOKENS } from '../../ports/tokens.js';

function toDTO(n: Notification): NotificationDTO {
  const s = n.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    type: s.type,
    title: s.title,
    body: s.body,
    data: s.data,
    url: s.url,
    read: s.read,
    createdAt: s.createdAt.toISOString(),
  };
}

@injectable()
export class ListNotificationsUseCase {
  constructor(@inject(TOKENS.NotificationRepository) private readonly repo: INotificationRepository) {}
  async execute(userId: Id, limit = 50): Promise<NotificationDTO[]> {
    const list = await this.repo.listForUser(userId, limit);
    return list.map(toDTO);
  }
}

@injectable()
export class MarkNotificationReadUseCase {
  constructor(@inject(TOKENS.NotificationRepository) private readonly repo: INotificationRepository) {}
  async execute(id: Id, userId: Id): Promise<void> {
    const n = await this.repo.findById(id);
    if (!n) return;
    if (n.snapshot.userId !== userId) return;
    n.markRead();
    await this.repo.save(n);
  }
}

@injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(@inject(TOKENS.NotificationRepository) private readonly repo: INotificationRepository) {}
  async execute(userId: Id): Promise<void> {
    await this.repo.markAllRead(userId);
  }
}

@injectable()
export class CountUnreadNotificationsUseCase {
  constructor(@inject(TOKENS.NotificationRepository) private readonly repo: INotificationRepository) {}
  async execute(userId: Id): Promise<{ count: number }> {
    const count = await this.repo.countUnread(userId);
    return { count };
  }
}

@injectable()
export class CreateNotificationUseCase {
  constructor(
    @inject(TOKENS.NotificationRepository) private readonly repo: INotificationRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.WebPushSubscriptionRepository) private readonly pushSubs: IWebPushSubscriptionRepository,
    @inject(TOKENS.WebPushService) private readonly webPush: IWebPushService,
    @inject(TOKENS.EmailService) private readonly email: IEmailService,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(input: {
    userId: Id;
    type: Notification['snapshot']['type'];
    title: string;
    body: string;
    data?: Record<string, unknown>;
    url?: string;
  }): Promise<NotificationDTO> {
    const n = Notification.create({ id: newId(), ...input });
    await this.repo.save(n);
    void this.deliver(n.snapshot).catch(() => {});
    return toDTO(n);
  }

  private async deliver(snapshot: Notification['snapshot']): Promise<void> {
    const user = await this.users.findById(snapshot.userId);
    if (!user) return;

    // Web push to all active subscriptions
    try {
      const subs = await this.pushSubs.listForUser(snapshot.userId);
      for (const sub of subs) {
        await this.webPush.send(
          { endpoint: sub.snapshot.endpoint, keys: sub.snapshot.keys },
          snapshot.title,
          snapshot.body,
          { ...(snapshot.data ?? {}), url: snapshot.url },
        );
      }
    } catch (err) {
      this.logger.warn('web push delivery failed', { err: String(err), userId: snapshot.userId });
    }

    // Check email preferences before sending
    const prefs = user.snapshot.emailPreferences;
    const shouldSendEmail = () => {
      switch (snapshot.type) {
        case 'match': return prefs.matches;
        case 'message': return prefs.chat;
        case 'courier': return prefs.courier;
        case 'system': return prefs.reminders;
        case 'marketplace': return true;
        case 'tag': return true;
        default: return false;
      }
    };
    if (!shouldSendEmail()) return;

    try {
      const to = user.email;
      const name = user.snapshot.name;
      const locale = user.snapshot.locale;

      switch (snapshot.type) {
        case 'match': {
          const itemTitle = (snapshot.data?.itemTitle as string) || snapshot.title;
          await this.email.sendMatchAlert(to, name, itemTitle, snapshot.url ?? '', locale);
          break;
        }
        case 'message':
          await this.email.sendChatNotification(to, name, snapshot.url ?? '', locale);
          break;
        case 'courier':
          await this.email.sendCourierUpdate(to, name, snapshot.title, snapshot.body, locale);
          break;
        case 'system':
          await this.email.sendGenericNotification(to, name, snapshot.title, snapshot.body, locale);
          break;
        case 'marketplace':
          await this.email.sendMarketplaceAlert(to, name, snapshot.title, snapshot.body, locale);
          break;
        case 'tag':
          await this.email.sendGenericNotification(to, name, snapshot.title, snapshot.body, locale);
          break;
      }
    } catch (err) {
      this.logger.warn('email delivery failed', { err: String(err), userId: snapshot.userId, type: snapshot.type });
    }
  }
}
