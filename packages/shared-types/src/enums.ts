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

/**
 * Strength of evidence behind a recovery. Drives the BakPoints multiplier —
 * a peer-only handover is the weakest signal, institutional custody the strongest.
 * (Spec §5: Verification Levels & Reward Multipliers.)
 */
export const VerificationLevel = {
  /** A — owner and finder meet directly; no independent evidence. */
  Peer: 'peer',
  /** B — finder deposits at a Bak2Me Recovery Point; partner accepts and releases. */
  RecoveryPoint: 'recovery_point',
  /** C — tracked partner/courier collection and delivery. */
  VerifiedDelivery: 'verified_delivery',
  /** D — police, university, mall, hospital, transport operator. */
  Institutional: 'institutional',
} as const;
export type VerificationLevel = (typeof VerificationLevel)[keyof typeof VerificationLevel];

/**
 * Lifecycle of a single BakPoints ledger entry. Entries are append-oriented:
 * clearing/reversal records a state change, never a rewrite of `points`.
 */
export const PointEntryStatus = {
  /** Earned but inside the fraud/dispute holding period. Not spendable. */
  Pending: 'pending',
  /** Holding period elapsed and risk checks passed; added to the balance. */
  Cleared: 'cleared',
  /** Clawed back after confirmed fraud or a successful dispute. */
  Reversed: 'reversed',
  /** Voided before clearing (duplicate, withdrawn recovery). */
  Cancelled: 'cancelled',
} as const;
export type PointEntryStatus = (typeof PointEntryStatus)[keyof typeof PointEntryStatus];

/** Risk band a Recovery Risk Score falls into. (Spec §6.) */
export const RiskBand = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
} as const;
export type RiskBand = (typeof RiskBand)[keyof typeof RiskBand];
