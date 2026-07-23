import { randomBytes } from 'node:crypto';

import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import { User } from '../../../domain/user/user.entity.js';
import type { IRefreshTokenRepository } from '../../ports/auth-repos.js';
import type { IRedemptionRepository } from '../../ports/redemption-repo.js';
import type {
  IBookmarkRepository,
  ICourierJobRepository,
  IItemRepository,
  IMatchRepository,
  IMessageRepository,
  INotificationRepository,
  IQrTagOrderRepository,
  IQrTagRepository,
  IReviewRepository,
  IThreadRepository,
  IUserRepository,
  IZoneSubscriptionRepository,
} from '../../ports/repositories.js';
import type { IPasswordHasher } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { toUserDTO } from '../auth/register-user.js';

@injectable()
export class ComprehensiveExportUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.ThreadRepository) private readonly threads: IThreadRepository,
    @inject(TOKENS.MessageRepository) private readonly messages: IMessageRepository,
    @inject(TOKENS.NotificationRepository) private readonly notifications: INotificationRepository,
    @inject(TOKENS.BookmarkRepository) private readonly bookmarks: IBookmarkRepository,
    @inject(TOKENS.RedemptionRepository) private readonly redemptions: IRedemptionRepository,
    @inject(TOKENS.CourierJobRepository) private readonly courierJobs: ICourierJobRepository,
    @inject(TOKENS.QrTagRepository) private readonly qrTags: IQrTagRepository,
    @inject(TOKENS.QrTagOrderRepository) private readonly qrTagOrders: IQrTagOrderRepository,
    @inject(TOKENS.ZoneSubscriptionRepository) private readonly zones: IZoneSubscriptionRepository,
    @inject(TOKENS.ReviewRepository) private readonly reviews: IReviewRepository,
  ) {}

  async execute(userId: Id): Promise<Record<string, unknown>> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');

    const [itemPage, threads, notifications, bookmarks, redemptions, courierJobs, qrTags, qrTagOrders, zones, reviews] =
      await Promise.all([
        this.items.list({ postedById: userId, page: 1, pageSize: 1000 }),
        this.threads.findForUser(userId),
        this.notifications.listForUser(userId, 1000),
        this.bookmarks.listForUser(userId),
        this.redemptions.listForUser(userId, 1000),
        this.courierJobs.listForUser(userId),
        this.qrTags.listForOwner(userId),
        this.qrTagOrders.listForUser(userId),
        this.zones.listForOwner(userId),
        this.reviews.listForReviewee(userId, { limit: 1000 }),
      ]);

    const matches = (
      await Promise.all(itemPage.items.map((i) => this.matches.listForItem(i.snapshot.id)))
    ).flat();
    const messages = (
      await Promise.all(threads.map((t) => this.messages.listForThread(t.snapshot.id)))
    ).flat();

    return {
      exportedAt: new Date().toISOString(),
      profile: toUserDTO(user),
      items: itemPage.items.map((i) => i.snapshot),
      matches: matches.map((m) => m.snapshot),
      threads: threads.map((t) => t.snapshot),
      messages: messages.map((m) => m.snapshot),
      notifications: notifications.map((n) => n.snapshot),
      bookmarks: bookmarks.map((b) => b.snapshot),
      redemptions: redemptions.map((r) => r.snapshot),
      courierJobs: courierJobs.map((j) => j.snapshot),
      qrTags: qrTags.map((t) => t.snapshot),
      qrTagOrders: qrTagOrders.map((o) => o.snapshot),
      zoneSubscriptions: zones.map((z) => z.snapshot),
      reviews: reviews.map((r) => r.snapshot),
    };
  }
}

@injectable()
export class DeleteAccountUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly refreshTokens: IRefreshTokenRepository,
    @inject(TOKENS.PasswordHasher) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(userId: Id): Promise<{ deleted: true }> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');

    // PII anonymisation: scrub identifying fields, scramble credentials,
    // block future logins, and kill every active session.
    const s = user.snapshot;
    const anonymised = User.rehydrate({
      ...s,
      email: `deleted-${s.id}@anonymised.invalid`,
      name: 'Deleted user',
      phone: undefined,
      avatarUrl: undefined,
      pushTokens: [],
      passwordHash: await this.hasher.hash(randomBytes(24).toString('hex')),
      status: 'banned',
      institutionId: undefined,
      emailPreferences: { marketing: false, matches: false, chat: false, reminders: false, courier: false },
    });
    await this.users.save(anonymised);
    await this.refreshTokens.revokeAllForUser(userId);

    return { deleted: true };
  }
}
