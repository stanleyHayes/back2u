export const ItemKind = {
  Lost: 'lost',
  Found: 'found',
} as const;
export type ItemKind = (typeof ItemKind)[keyof typeof ItemKind];

export const ItemStatus = {
  Open: 'open',
  Matched: 'matched',
  Claimed: 'claimed',
  Returned: 'returned',
  Closed: 'closed',
  Archived: 'archived',
  Auctioned: 'auctioned',
  Donated: 'donated',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const Classification = {
  Lost: 'lost',
  Stolen: 'stolen',
} as const;
export type Classification = (typeof Classification)[keyof typeof Classification];

export const UserRole = {
  User: 'user',
  Finder: 'finder',
  TrustedFinder: 'trusted_finder',
  Courier: 'courier',
  PartnerAdmin: 'partner_admin',
  Admin: 'admin',
  SuperAdmin: 'super_admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MatchStatus = {
  Suggested: 'suggested',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Verified: 'verified',
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const RewardStatus = {
  Pending: 'pending',
  Held: 'held',
  Released: 'released',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
} as const;
export type RewardStatus = (typeof RewardStatus)[keyof typeof RewardStatus];

export const VerificationStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const CourierStatus = {
  Requested: 'requested',
  Accepted: 'accepted',
  PickedUp: 'picked_up',
  InTransit: 'in_transit',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
} as const;
export type CourierStatus = (typeof CourierStatus)[keyof typeof CourierStatus];

export const TagStatus = {
  Unclaimed: 'unclaimed',
  Active: 'active',
  Lost: 'lost',
  Disabled: 'disabled',
} as const;
export type TagStatus = (typeof TagStatus)[keyof typeof TagStatus];

export const MarketplaceListingStatus = {
  Pending: 'pending',
  Live: 'live',
  Sold: 'sold',
  Donated: 'donated',
  Withdrawn: 'withdrawn',
  Cancelled: 'cancelled',
} as const;
export type MarketplaceListingStatus =
  (typeof MarketplaceListingStatus)[keyof typeof MarketplaceListingStatus];

export const Locale = {
  En: 'en',
  Fr: 'fr',
  Twi: 'tw',
  Ga: 'ga',
  Ewe: 'ee',
} as const;
export type Locale = (typeof Locale)[keyof typeof Locale];
