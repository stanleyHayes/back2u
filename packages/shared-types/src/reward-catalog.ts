import type { TrustLevel } from './trust.js';

/**
 * Kinds of partner-funded benefit (spec §13). The early-stage model is
 * deliberately partner-funded perks rather than BakPoints-to-cash, which keeps
 * the platform off the hook for funding rewards and removes the direct
 * financial incentive to manufacture recoveries.
 */
export type RewardCategory =
  | 'mobile_data'
  | 'ride_credit'
  | 'delivery_discount'
  | 'restaurant_voucher'
  | 'retail_discount'
  | 'event_perk'
  | 'insurance_benefit'
  | 'merchandise';

export const REWARD_CATEGORIES: readonly RewardCategory[] = [
  'mobile_data',
  'ride_credit',
  'delivery_discount',
  'restaurant_voucher',
  'retail_discount',
  'event_perk',
  'insurance_benefit',
  'merchandise',
];

export const REWARD_CATEGORY_LABELS: Record<RewardCategory, string> = {
  mobile_data: 'Mobile data',
  ride_credit: 'Ride credit',
  delivery_discount: 'Delivery discount',
  restaurant_voucher: 'Restaurant voucher',
  retail_discount: 'Retail discount',
  event_perk: 'Event perk',
  insurance_benefit: 'Insurance benefit',
  merchandise: 'Bak2Me merchandise',
};

export type RewardOfferStatus = 'draft' | 'live' | 'paused' | 'ended';

export interface RewardOfferDTO {
  id: string;
  institutionId: string;
  /** Joined for display in the catalogue. */
  institutionName?: string;
  title: string;
  description: string;
  category: RewardCategory;
  imageUrl?: string;
  /** BakPoints a member spends to reserve one of these. */
  pointsCost: number;
  status: RewardOfferStatus;
  /** Total ever offered. `null` means unlimited. */
  totalInventory: number | null;
  /** Still available to reserve. `null` when inventory is unlimited. */
  remainingInventory: number | null;
  /** Campaign window; outside it the offer cannot be reserved. */
  startsAt?: string;
  endsAt?: string;
  /** How many one member may hold or have redeemed. `null` means no limit. */
  perUserLimit: number | null;
  /** Minimum community standing required, tying eligibility to §16. */
  minTrustLevel?: TrustLevel;
  /** How long a reservation is held before it expires back to the pool. */
  reservationHours: number;
  termsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** The catalogue as a member sees it, with their own eligibility resolved. */
export interface RewardOfferListingDTO extends RewardOfferDTO {
  /** False when the member cannot reserve this right now. */
  eligible: boolean;
  /** Why not, in words the member can act on. */
  ineligibleReason?: string;
}

export interface CreateRewardOfferInput {
  title: string;
  description: string;
  category: RewardCategory;
  pointsCost: number;
  imageUrl?: string;
  totalInventory?: number | null;
  startsAt?: string;
  endsAt?: string;
  perUserLimit?: number | null;
  minTrustLevel?: TrustLevel;
  reservationHours?: number;
  termsUrl?: string;
}

export type UpdateRewardOfferInput = Partial<CreateRewardOfferInput> & {
  status?: RewardOfferStatus;
};

/** Per-offer redemption analytics for the partner console (spec §13). */
export interface RewardOfferStatsDTO {
  offerId: string;
  title: string;
  status: RewardOfferStatus;
  pointsCost: number;
  remainingInventory: number | null;
  reserved: number;
  redeemed: number;
  expired: number;
  reversed: number;
  /** Points actually spent by members on this offer (redeemed only). */
  pointsSpent: number;
  /** redeemed ÷ (redeemed + expired) — how often a reservation is collected. */
  collectionRate: number | null;
}

export interface PartnerRewardAnalyticsDTO {
  institutionId: string;
  liveOffers: number;
  totalReserved: number;
  totalRedeemed: number;
  totalPointsSpent: number;
  offers: RewardOfferStatsDTO[];
}
