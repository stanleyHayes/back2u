import type {
  AuditLogDTO,
  BookmarkDTO,
  ChatMessageDTO,
  ChatThreadDTO,
  CourierJobDTO,
  FeatureFlagDTO,
  InstitutionDTO,
  InstitutionLeadDTO,
  MarketplaceListingDTO,
  MarketplaceListingItemDTO,
  BidDTO,
  ModerationQueueItemDTO,
  NotificationDTO,
  OwnershipVerificationDTO,
  PartnerApiKeyDTO,
  PoliceCaseRefDTO,
  QrTagDTO,
  QrTagOrderDTO,
  QrTagProductDTO,
  RedemptionDTO,
  ReviewDTO,
  RewardDTO,
  SafetyReportDTO,
  TrustedFinderApplicationDTO,
  UserDTO,
  VaultEntryDTO,
  WebhookDTO,
  ZoneSubscriptionDTO,
} from '@back2u/shared-types';

import type { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import type { Bookmark } from '../../../domain/bookmark/bookmark.entity.js';
import type { Message } from '../../../domain/chat/message.entity.js';
import type { Thread } from '../../../domain/chat/thread.entity.js';
import type { CourierJob } from '../../../domain/courier/courier-job.entity.js';
import type { FeatureFlag } from '../../../domain/feature-flag/feature-flag.entity.js';
import type { InstitutionLead } from '../../../domain/institution/institution-lead.entity.js';
import type { Institution } from '../../../domain/institution/institution.entity.js';
import type { PartnerApiKey } from '../../../domain/institution/partner-api-key.entity.js';
import type { Item } from '../../../domain/item/item.entity.js';
import type {
  Bid,
  MarketplaceListing,
} from '../../../domain/marketplace_listing/marketplace-listing.entity.js';
import type { ModerationQueueItem } from '../../../domain/moderation/moderation-queue-item.entity.js';
import type { Notification } from '../../../domain/notification/notification.entity.js';
import type { PoliceCase } from '../../../domain/announcement/police-case.entity.js';
import type { PointsRedemption } from '../../../domain/redemption/redemption.entity.js';
import type { Review } from '../../../domain/review/review.entity.js';
import type { Reward } from '../../../domain/reward/reward.entity.js';
import type { Report } from '../../../domain/safety/report.entity.js';
import type { ZoneSubscription } from '../../../domain/subscription/zone-subscription.entity.js';
import type { QrTagOrder } from '../../../domain/tag/qr-tag-order.entity.js';
import type { QrTagProduct } from '../../../domain/tag/qr-tag-product.entity.js';
import type { QrTag } from '../../../domain/tag/qr-tag.entity.js';
import type { TrustedFinderApplication } from '../../../domain/trusted-finder/trusted-finder-application.entity.js';
import type { User } from '../../../domain/user/user.entity.js';
import type { VaultEntry } from '../../../domain/vault/vault-entry.entity.js';
import type { OwnershipVerification } from '../../../domain/verification/verification.entity.js';
import type { Webhook } from '../../../domain/webhook/webhook.entity.js';
import { toItemDTO } from './item.mapper.js';

export function toQrTagDTO(tag: QrTag): QrTagDTO {
  const s = tag.snapshot;
  return {
    id: s.id,
    code: s.code,
    ownerId: s.ownerId,
    itemLabel: s.itemLabel,
    status: s.status,
    lastSeenAt: s.lastSeenAt?.toISOString(),
    lastSeenAt_point: s.lastSeenPoint,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toQrTagProductDTO(product: QrTagProduct): QrTagProductDTO {
  const s = product.snapshot;
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    currency: s.currency,
    quantity: s.quantity,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toQrTagOrderDTO(order: QrTagOrder): QrTagOrderDTO {
  const s = order.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    products: s.products.map((p) => ({
      productId: p.productId,
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      tagsPerPack: p.tagsPerPack,
    })),
    total: s.total,
    currency: s.currency,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toThreadDTO(thread: Thread): ChatThreadDTO {
  const s = thread.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    matchId: s.matchId,
    participantIds: s.participantIds,
    lastMessageAt: s.lastMessageAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}
export const toChatThreadDTO = toThreadDTO;

export function toMessageDTO(message: Message): ChatMessageDTO {
  const s = message.snapshot;
  return {
    id: s.id,
    threadId: s.threadId,
    authorId: s.authorId,
    body: s.body,
    createdAt: s.createdAt.toISOString(),
    flagged: s.flagged,
    readBy: s.readBy,
    images: s.images,
  };
}
export const toChatMessageDTO = toMessageDTO;

export function toNotificationDTO(n: Notification): NotificationDTO {
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

export function toBookmarkDTO(bookmark: Bookmark, item?: Item | null): BookmarkDTO {
  const s = bookmark.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    itemId: s.itemId,
    item: item ? toItemDTO(item) : null,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toReviewDTO(review: Review): ReviewDTO {
  const s = review.snapshot;
  return {
    id: s.id,
    reviewerId: s.reviewerId,
    revieweeId: s.revieweeId,
    itemId: s.itemId,
    matchId: s.matchId,
    rating: s.rating,
    comment: s.comment,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toCourierJobDTO(job: CourierJob): CourierJobDTO {
  const s = job.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    pickup: s.pickup,
    dropoff: s.dropoff,
    fee: s.fee,
    currency: s.currency,
    status: s.status,
    riderId: s.riderId,
    requesterId: s.requesterId,
    pickupCode: s.pickupCode,
    deliveryCode: s.deliveryCode,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toVaultEntryDTO(entry: VaultEntry): VaultEntryDTO {
  const s = entry.snapshot;
  return {
    id: s.id,
    ownerId: s.ownerId,
    label: s.label,
    category: s.category,
    serialNumber: s.serialNumber,
    imei: s.imei,
    receiptImageUrl: s.receiptImageUrl,
    photoUrls: s.photoUrls,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toZoneSubscriptionDTO(zone: ZoneSubscription): ZoneSubscriptionDTO {
  const s = zone.snapshot;
  return {
    id: s.id,
    ownerId: s.ownerId,
    name: s.name,
    polygon: s.polygon,
    channels: s.channels,
    createdAt: s.createdAt.toISOString(),
  };
}

function toListingItemSummary(item: Item): MarketplaceListingItemDTO {
  const s = item.snapshot;
  return {
    title: s.title,
    category: s.category,
    kind: s.kind,
    imageUrl: s.images[0]?.url,
    placeName: s.place.name,
  };
}

export function toMarketplaceListingDTO(
  listing: MarketplaceListing,
  item?: Item | MarketplaceListingItemDTO | null,
): MarketplaceListingDTO {
  const s = listing.snapshot;
  const itemDTO =
    item == null
      ? undefined
      : typeof (item as Item).snapshot === 'object'
        ? toListingItemSummary(item as Item)
        : (item as MarketplaceListingItemDTO);
  return {
    id: s.id,
    itemId: s.itemId,
    startingPrice: s.startingPrice,
    currency: s.currency,
    buyNowPrice: s.buyNowPrice,
    closesAt: s.closesAt.toISOString(),
    status: s.status,
    highBidId: s.highBidId,
    charityRecipient: s.charityRecipient,
    item: itemDTO,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toBidDTO(bid: Bid): BidDTO {
  const s = bid.snapshot;
  return {
    id: s.id,
    listingId: s.listingId,
    bidderId: s.bidderId,
    amount: s.amount,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toAuditLogDTO(log: AuditLog): AuditLogDTO {
  const s = log.snapshot;
  return {
    id: s.id,
    actorId: s.actorId,
    action: s.action,
    entity: s.entity,
    entityId: s.entityId,
    meta: s.meta,
    ip: s.ip,
    userAgent: s.userAgent,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toPoliceCaseDTO(p: PoliceCase): PoliceCaseRefDTO {
  const s = p.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    caseNumber: s.caseNumber,
    station: s.station,
    pdfUrl: s.pdfUrl,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toInstitutionDTO(institution: Institution): InstitutionDTO {
  const s = institution.snapshot;
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    contactEmail: s.contactEmail,
    place: s.place,
    pointsRedeemable: s.pointsRedeemable,
    pointToCurrencyRate: s.pointToCurrencyRate,
    subscriptionTier: s.subscriptionTier,
    subscriptionRenewsAt: s.subscriptionRenewsAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
    rewardsListed: s.rewardsListed,
    logoUrl: s.logoUrl,
    description: s.description,
    website: s.website,
  };
}

export function toInstitutionLeadDTO(lead: InstitutionLead): InstitutionLeadDTO {
  const s = lead.snapshot;
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    contactName: s.contactName,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    city: s.city,
    lat: s.lat,
    lng: s.lng,
    estimatedVolume: s.estimatedVolume,
    message: s.message,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toWebhookDTO(webhook: Webhook): WebhookDTO {
  const s = webhook.snapshot;
  return {
    id: s.id,
    institutionId: s.institutionId,
    url: s.url,
    events: s.events,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toTrustedFinderApplicationDTO(
  app: TrustedFinderApplication,
): TrustedFinderApplicationDTO {
  const s = app.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    status: s.status,
    reason: s.reason,
    idPhotoUrl: s.idPhotoUrl,
    bio: s.bio,
    createdAt: s.createdAt.toISOString(),
    decidedAt: s.decidedAt?.toISOString(),
  };
}

export function toFeatureFlagDTO(flag: FeatureFlag): FeatureFlagDTO {
  const s = flag.snapshot;
  return {
    id: s.id,
    key: s.key,
    name: s.name,
    description: s.description,
    enabled: s.enabled,
    rolloutPercentage: s.rolloutPercentage,
    allowedUserIds: s.allowedUserIds,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toRewardDTO(reward: Reward): RewardDTO {
  const s = reward.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    amount: s.amount,
    currency: s.currency,
    pointsBonus: s.pointsBonus,
    status: s.status,
    finderId: s.finderId,
    releasedAt: s.releasedAt?.toISOString(),
    commissionAmount: s.commissionAmount,
    createdAt: s.createdAt.toISOString(),
  };
}

export function toRedemptionDTO(
  redemption: PointsRedemption,
  institutionName?: string,
): RedemptionDTO {
  const s = redemption.snapshot;
  return {
    id: s.id,
    userId: s.userId,
    institutionId: s.institutionId,
    institutionName,
    points: s.points,
    value: s.value,
    currency: s.currency,
    code: s.code,
    status: s.status,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    fulfilledAt: s.fulfilledAt?.toISOString(),
  };
}

export function toModerationQueueItemDTO(item: ModerationQueueItem): ModerationQueueItemDTO {
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

export function toSafetyReportDTO(report: Report): SafetyReportDTO {
  const s = report.snapshot;
  return {
    id: s.id,
    reporterId: s.reporterId,
    target: s.target,
    targetId: s.targetId,
    reason: s.reason,
    note: s.note,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    decidedAt: s.decidedAt?.toISOString(),
    reviewerId: s.reviewerId,
    reviewerNote: s.reviewerNote,
  };
}
export const toReportDTO = toSafetyReportDTO;

export function toVerificationDTO(v: OwnershipVerification): OwnershipVerificationDTO {
  const s = v.snapshot;
  return {
    id: s.id,
    itemId: s.itemId,
    claimantId: s.claimantId,
    answers: s.answers,
    proofs: s.proofs,
    aiConsistencyScore: s.aiConsistencyScore,
    status: s.status,
    reviewerId: s.reviewerId,
    reviewerNote: s.reviewerNote,
    createdAt: s.createdAt.toISOString(),
    decidedAt: s.decidedAt?.toISOString(),
  };
}
export const toOwnershipVerificationDTO = toVerificationDTO;

export function toPartnerApiKeyDTO(key: PartnerApiKey): PartnerApiKeyDTO {
  const s = key.snapshot;
  return {
    id: s.id,
    institutionId: s.institutionId,
    name: s.name,
    createdAt: s.createdAt.toISOString(),
    lastUsedAt: s.lastUsedAt?.toISOString(),
  };
}

export function toUserDTO(user: User): UserDTO {
  const s = user.snapshot;
  return {
    id: s.id,
    email: s.email,
    name: s.name,
    phone: s.phone,
    avatarUrl: s.avatarUrl,
    roles: s.roles,
    status: s.status,
    reputationScore: s.reputationScore,
    pointsBalance: s.pointsBalance,
    successfulReturns: s.successfulReturns,
    averageRating: s.averageRating,
    reviewCount: s.reviewCount,
    emailVerified: s.emailVerified,
    phoneVerified: s.phoneVerified,
    trustedFinder: s.trustedFinder,
    institutionId: s.institutionId,
    locale: s.locale,
    badges: s.badges,
    pushTokens: s.pushTokens,
    emailPreferences: s.emailPreferences,
    createdAt: s.createdAt.toISOString(),
  };
}
