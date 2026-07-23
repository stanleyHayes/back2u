import { z } from 'zod';

import { PlaceRefSchema } from './schemas.js';

// ---- QR tags ----

export const ClaimTagSchema = z.object({
  code: z.string().min(1),
  itemLabel: z.string().optional(),
});

export const ScanTagSchema = z.object({
  finderMessage: z.string().min(1),
  finderEmail: z.string().email().optional(),
});

export const HeartbeatSchema = z.object({
  tagCode: z.string().min(1),
  point: z.object({ lng: z.number(), lat: z.number() }),
  rssi: z.number().optional(),
});

export const CreateQrTagOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1),
});

// ---- Courier ----

export const CreateCourierJobSchema = z.object({
  itemId: z.string().min(1),
  pickup: PlaceRefSchema,
  dropoff: PlaceRefSchema,
  fee: z.number().int().nonnegative(),
});

export const TransitionCourierJobSchema = z.object({
  transition: z.enum(['pickup', 'in_transit', 'deliver', 'cancel']),
  code: z.string().optional(),
});

export const CourierRouteSchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1),
  riderLng: z.number().optional(),
  riderLat: z.number().optional(),
});

// ---- Vault ----

export const CreateVaultEntrySchema = z.object({
  label: z.string().min(1),
  category: z.string().min(1),
  serialNumber: z.string().optional(),
  imei: z.string().optional(),
  receiptImageUrl: z.string().url().optional(),
  photoUrls: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

// ---- Zones ----

export const CreateZoneSchema = z.object({
  name: z.string().min(1),
  polygon: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  channels: z.array(z.enum(['push', 'email', 'sms'])).optional(),
});

// ---- Marketplace ----

export const CreateListingSchema = z.object({
  itemId: z.string().min(1),
  startingPrice: z.number().int().nonnegative(),
  buyNowPrice: z.number().int().positive().optional(),
  daysOpen: z.number().int().positive().optional(),
  charityRecipient: z.string().optional(),
});

export const PlaceBidSchema = z.object({
  amount: z.number().int().positive(),
});

// ---- Police ----

export const FilePoliceCaseSchema = z.object({
  caseNumber: z.string().min(1),
  station: z.string().min(1),
});

// ---- Institutions ----

export const InstitutionTypeSchema = z.enum([
  'school',
  'airport',
  'transport',
  'event',
  'mall',
  'restaurant',
  'cafe',
  'retail',
  'pharmacy',
  'hotel',
  'other',
]);

export const OnboardInstitutionSchema = z.object({
  name: z.string().min(1),
  type: InstitutionTypeSchema,
  contactEmail: z.string().email(),
  place: PlaceRefSchema,
  pointsRedeemable: z.boolean().optional(),
  pointToCurrencyRate: z.number().positive().optional(),
  webhookUrl: z.string().url().optional(),
});

export const InstitutionLeadSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  city: z.string().min(1),
  estimatedVolume: z.string().optional(),
  message: z.string().optional(),
});

export const DecideLeadSchema = z.object({
  decision: z.enum(['contacted', 'approved', 'rejected']),
});

export const SubscribeInstitutionSchema = z.object({
  tier: z.enum(['free', 'pro', 'enterprise']),
});

export const UpdateRewardsProfileSchema = z
  .object({
    rewardsListed: z.boolean().optional(),
    pointsRedeemable: z.boolean().optional(),
    pointToCurrencyRate: z.number().positive().optional(),
    type: InstitutionTypeSchema.optional(),
    logoUrl: z.string().url().optional(),
    description: z.string().optional(),
    website: z.string().url().optional(),
  })
  .strict();

// ---- Redemptions ----

export const CreateRedemptionSchema = z.object({
  institutionId: z.string().min(1),
  points: z.number().int().positive(),
});

export const ConfirmRedemptionSchema = z.object({
  code: z.string().min(1),
});

// ---- Webhooks ----

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
});

export const UpdateWebhookSchema = z
  .object({
    url: z.string().url().optional(),
    events: z.array(z.string().min(1)).optional(),
    active: z.boolean().optional(),
  })
  .strict();

// ---- Bookmarks ----

export const BookmarkSchema = z.object({
  itemId: z.string().min(1),
});

// ---- Reviews ----

export const CreateReviewSchema = z.object({
  matchId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// ---- Safety & moderation ----

export const BlockUserSchema = z.object({
  blockedId: z.string().min(1),
});

export const FileReportSchema = z.object({
  target: z.enum(['user', 'item', 'message', 'listing']),
  targetId: z.string().min(1),
  reason: z.enum(['scam', 'harassment', 'spam', 'inappropriate', 'other']),
  note: z.string().optional(),
});

export const DecideReportSchema = z.object({
  decision: z.enum(['action', 'dismiss', 'resolved']),
  note: z.string().optional(),
});

export const ReviewModerationSchema = z.object({
  decision: z.enum(['approve', 'remove']),
});

// ---- Users (admin) ----

export const UpdateUserStatusSchema = z.object({
  status: z.string().min(1),
  reason: z.string().optional(),
});

export const UpdateUserRolesSchema = z.object({
  roles: z.array(
    z.enum(['user', 'finder', 'trusted_finder', 'courier', 'partner_admin', 'admin', 'super_admin']),
  ),
});

// ---- Trusted finder ----

export const ApplyTrustedFinderSchema = z.object({
  idPhotoUrl: z.string().min(1),
  bio: z.string().optional(),
});

export const DecideTrustedFinderSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

// ---- Feature flags ----

export const UpdateRolloutSchema = z.object({
  rolloutPercentage: z.number().min(0).max(100),
  allowedUserIds: z.array(z.string().min(1)).optional(),
});

// ---- Partner API keys (admin) ----

export const CreatePartnerApiKeySchema = z.object({
  institutionId: z.string().min(1),
  name: z.string().min(1),
});

export const UpdatePartnerItemStatusSchema = z.object({
  status: z.string().min(1),
});

// ---- Web push ----

export const WebPushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export const WebPushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// ---- Account ----

export const DeleteAccountSchema = z.object({
  acknowledge: z.literal(true),
});

// ---- Notifications (admin/manual) ----

export const CreateNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['match', 'message', 'courier', 'marketplace', 'tag', 'system']),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  url: z.string().optional(),
});
