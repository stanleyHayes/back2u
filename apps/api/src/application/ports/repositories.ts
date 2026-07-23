import type { ItemKind, ItemStatus } from '@back2u/shared-types';

import type { AuditLog } from '../../domain/audit/audit-log.entity.js';
import type { CourierJob } from '../../domain/courier/courier-job.entity.js';
import type { Institution } from '../../domain/institution/institution.entity.js';
import type { InstitutionLead } from '../../domain/institution/institution-lead.entity.js';
import type { Item } from '../../domain/item/item.entity.js';
import type { Notification } from '../../domain/notification/notification.entity.js';
import type { Bid, MarketplaceListing } from '../../domain/marketplace_listing/marketplace-listing.entity.js';
import type { Match } from '../../domain/match/match.entity.js';
import type { Message } from '../../domain/chat/message.entity.js';
import type { OwnershipVerification } from '../../domain/verification/verification.entity.js';
import type { PoliceCase } from '../../domain/announcement/police-case.entity.js';
import type { QrTag } from '../../domain/tag/qr-tag.entity.js';
import type { QrTagProduct } from '../../domain/tag/qr-tag-product.entity.js';
import type { QrTagOrder } from '../../domain/tag/qr-tag-order.entity.js';
import type { Reward } from '../../domain/reward/reward.entity.js';
import type { Id } from '../../domain/shared/id.js';
import type { Thread } from '../../domain/chat/thread.entity.js';
import type { User } from '../../domain/user/user.entity.js';
import type { Webhook } from '../../domain/webhook/webhook.entity.js';
import type { TrustedFinderApplication } from '../../domain/trusted-finder/trusted-finder-application.entity.js';
import type { VaultEntry } from '../../domain/vault/vault-entry.entity.js';
import type { ZoneSubscription } from '../../domain/subscription/zone-subscription.entity.js';
import type { ModerationQueueItem } from '../../domain/moderation/moderation-queue-item.entity.js';
import type { Bookmark } from '../../domain/bookmark/bookmark.entity.js';
import type { FeatureFlag } from '../../domain/feature-flag/feature-flag.entity.js';
import type { PartnerApiKey } from '../../domain/institution/partner-api-key.entity.js';
import type { Review } from '../../domain/review/review.entity.js';

export interface ItemListFilter {
  kind?: ItemKind;
  status?: ItemStatus;
  category?: string;
  text?: string;
  search?: string;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  near?: { lng: number; lat: number; radiusMeters: number };
  postedById?: Id;
  institutionId?: Id;
  page: number;
  pageSize: number;
  cursor?: { lastId: string; lastCreatedAt: string };
}

export interface IItemRepository {
  save(item: Item): Promise<void>;
  findById(id: Id): Promise<Item | null>;
  findByIds(ids: Id[]): Promise<Item[]>;
  list(filter: ItemListFilter): Promise<{ items: Item[]; total: number }>;
  findCandidatesFor(item: Item, opts: { radiusMeters: number; daysWindow: number; limit: number }): Promise<Item[]>;
  findByPerceptualHash(hash: string, threshold: number): Promise<Item[]>;
  findOlderThanReturned(beforeDate: Date): Promise<Item[]>;
  findByQrTagCode(code: string): Promise<Item | null>;
  findInPolygon(coordinates: number[][][], opts: { sinceDays: number }): Promise<Item[]>;
  countByStatus(): Promise<Record<string, number>>;
  countByKind(): Promise<Record<string, number>>;
  countByCategory(): Promise<Record<string, number>>;
  countPerDay(since: Date): Promise<{ date: string; count: number }[]>;
  autocomplete(prefix: string): Promise<{ cities: string[]; categories: string[] }>;
  findFlaggedForReview(limit: number): Promise<Item[]>;
  findRecentByKindAndCategory(kind: ItemKind, category: string, since: Date, limit: number): Promise<Item[]>;
  countByInstitution(institutionId: Id): Promise<{ total: number; byStatus: Record<string, number> }>;
  listRecentByInstitution(institutionId: Id, limit: number): Promise<Item[]>;
}

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: Id): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  topByPoints(limit: number): Promise<User[]>;
  list(filter: { limit?: number; offset?: number; search?: string }): Promise<User[]>;
  count(): Promise<number>;
  countPerDay(since: Date): Promise<{ date: string; count: number }[]>;
}

export interface IMatchRepository {
  save(match: Match): Promise<void>;
  findById(id: Id): Promise<Match | null>;
  findByPair(lostId: Id, foundId: Id): Promise<Match | null>;
  listForItem(itemId: Id): Promise<Match[]>;
  count(): Promise<{ total: number; accepted: number }>;
  countPerDay(since: Date): Promise<{ date: string; count: number }[]>;
}

export interface IThreadRepository {
  save(thread: Thread): Promise<void>;
  findById(id: Id): Promise<Thread | null>;
  findForUser(userId: Id): Promise<Thread[]>;
  findByItemAndParticipants(itemId: Id, participantIds: Id[]): Promise<Thread | null>;
}

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  findById(id: Id): Promise<Message | null>;
  listForThread(threadId: Id, limit?: number): Promise<Message[]>;
  markMessageRead(messageId: Id, userId: Id): Promise<void>;
}

export interface IRewardRepository {
  save(reward: Reward): Promise<void>;
  findById(id: Id): Promise<Reward | null>;
}

export interface IQrTagRepository {
  save(tag: QrTag): Promise<void>;
  saveMany(tags: QrTag[]): Promise<void>;
  findById(id: Id): Promise<QrTag | null>;
  findByCode(code: string): Promise<QrTag | null>;
  listForOwner(ownerId: Id): Promise<QrTag[]>;
}

export interface IQrTagProductRepository {
  save(product: QrTagProduct): Promise<void>;
  findById(id: Id): Promise<QrTagProduct | null>;
  list(): Promise<QrTagProduct[]>;
}

export interface IQrTagOrderRepository {
  save(order: QrTagOrder): Promise<void>;
  findById(id: Id): Promise<QrTagOrder | null>;
  listForUser(userId: Id): Promise<QrTagOrder[]>;
}

export interface IVerificationRepository {
  save(v: OwnershipVerification): Promise<void>;
  findById(id: Id): Promise<OwnershipVerification | null>;
  listForItem(itemId: Id): Promise<OwnershipVerification[]>;
  listPending(limit: number): Promise<OwnershipVerification[]>;
}

export interface ICourierJobRepository {
  save(j: CourierJob): Promise<void>;
  findById(id: Id): Promise<CourierJob | null>;
  listForUser(userId: Id): Promise<CourierJob[]>;
  listOpen(near?: { lng: number; lat: number; radiusMeters: number }): Promise<CourierJob[]>;
  count(): Promise<number>;
  countByItemIds(itemIds: Id[]): Promise<{ total: number; active: number }>;
}

export interface IVaultRepository {
  save(e: VaultEntry): Promise<void>;
  findById(id: Id): Promise<VaultEntry | null>;
  listForOwner(ownerId: Id): Promise<VaultEntry[]>;
  delete(id: Id, ownerId: Id): Promise<void>;
}

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<void>;
  list(filter: { entity?: string; entityId?: Id; actorId?: Id; limit: number }): Promise<AuditLog[]>;
}

export interface IZoneSubscriptionRepository {
  save(z: ZoneSubscription): Promise<void>;
  delete(id: Id, ownerId: Id): Promise<void>;
  listForOwner(ownerId: Id): Promise<ZoneSubscription[]>;
  findContaining(point: { lng: number; lat: number }): Promise<ZoneSubscription[]>;
}

export interface IMarketplaceListingRepository {
  save(l: MarketplaceListing): Promise<void>;
  saveBid(b: Bid): Promise<void>;
  findById(id: Id): Promise<MarketplaceListing | null>;
  findBidById(id: Id): Promise<Bid | null>;
  listLive(limit: number): Promise<MarketplaceListing[]>;
  listBids(listingId: Id): Promise<Bid[]>;
  listBidsForUser(userId: Id): Promise<Bid[]>;
  count(): Promise<{ listings: number; bids: number }>;
}

export interface IPoliceCaseRepository {
  save(p: PoliceCase): Promise<void>;
  findById(id: Id): Promise<PoliceCase | null>;
  findByItemId(itemId: Id): Promise<PoliceCase | null>;
}

export interface IInstitutionRepository {
  save(i: Institution): Promise<void>;
  findById(id: Id): Promise<Institution | null>;
  list(limit?: number): Promise<Institution[]>;
  count(): Promise<number>;
}

export interface IInstitutionLeadRepository {
  save(lead: InstitutionLead): Promise<void>;
  findById(id: Id): Promise<InstitutionLead | null>;
  list(limit?: number): Promise<InstitutionLead[]>;
}

export interface INotificationRepository {
  save(n: Notification): Promise<void>;
  findById(id: Id): Promise<Notification | null>;
  listForUser(userId: Id, limit: number): Promise<Notification[]>;
  markRead(id: Id): Promise<void>;
  markAllRead(userId: Id): Promise<void>;
  countUnread(userId: Id): Promise<number>;
}

export interface IWebhookRepository {
  save(w: Webhook): Promise<void>;
  findById(id: Id): Promise<Webhook | null>;
  listForInstitution(institutionId: Id): Promise<Webhook[]>;
  delete(id: Id): Promise<void>;
}

export interface IBookmarkRepository {
  save(bookmark: Bookmark): Promise<void>;
  findByUserAndItem(userId: Id, itemId: Id): Promise<Bookmark | null>;
  delete(userId: Id, itemId: Id): Promise<void>;
  listForUser(userId: Id): Promise<Bookmark[]>;
  countByItemId(itemId: Id): Promise<number>;
  countByItemIds(itemIds: Id[]): Promise<Record<Id, number>>;
}

export interface IModerationQueueRepository {
  save(item: ModerationQueueItem): Promise<void>;
  findById(id: Id): Promise<ModerationQueueItem | null>;
  list(filter: { type?: string; status?: string; limit: number }): Promise<ModerationQueueItem[]>;
}

export interface ITrustedFinderApplicationRepository {
  save(app: TrustedFinderApplication): Promise<void>;
  findById(id: Id): Promise<TrustedFinderApplication | null>;
  findPendingByUserId(userId: Id): Promise<TrustedFinderApplication | null>;
  list(status?: 'pending' | 'approved' | 'rejected', limit?: number): Promise<TrustedFinderApplication[]>;
}

export interface IFeatureFlagRepository {
  save(flag: FeatureFlag): Promise<void>;
  findById(id: Id): Promise<FeatureFlag | null>;
  findByKey(key: string): Promise<FeatureFlag | null>;
  listAll(): Promise<FeatureFlag[]>;
}

export interface IPartnerApiKeyRepository {
  save(key: PartnerApiKey): Promise<void>;
  findById(id: Id): Promise<PartnerApiKey | null>;
  findByKeyHash(keyHash: string): Promise<PartnerApiKey | null>;
  listByInstitution(institutionId: Id): Promise<PartnerApiKey[]>;
  listAll(): Promise<PartnerApiKey[]>;
  delete(id: Id): Promise<void>;
}

export interface IReviewRepository {
  save(review: Review): Promise<void>;
  findById(id: Id): Promise<Review | null>;
  findByReviewerAndMatch(reviewerId: Id, matchId: Id): Promise<Review | null>;
  listForReviewee(revieweeId: Id, opts?: { limit?: number }): Promise<Review[]>;
  countAndAverageForUser(userId: Id): Promise<{ count: number; average: number }>;
}
