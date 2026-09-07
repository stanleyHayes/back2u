import type { SupportedCurrency } from './currency.js';

/**
 * Redemption lifecycle (spec §13). `pending` is the spec's RESERVED and
 * `fulfilled` its REDEEMED — the existing names are kept because live data and
 * the partner console already use them. `expired` returns an uncollected
 * reservation to the pool; `reversed` claws one back after a dispute or fraud.
 */
export type RedemptionStatus = 'pending' | 'fulfilled' | 'cancelled' | 'expired' | 'reversed';

export interface CreateRedemptionInput {
  institutionId: string;
  points: number;
}

/**
 * A voucher created by a user to spend reputation points at a partner
 * institution. Points are held on creation; the institution confirms the
 * short `code` at the counter to fulfil it.
 */
export interface RedemptionDTO {
  id: string;
  userId: string;
  institutionId: string;
  institutionName?: string;
  points: number;
  /** Cash value in minor currency units (e.g. pesewa), = points × pointToCurrencyRate. */
  value: number;
  currency: SupportedCurrency;
  code: string;
  status: RedemptionStatus;
  note?: string;
  /** The catalogue offer this came from, when it was not a plain points spend. */
  offerId?: string;
  offerTitle?: string;
  /** When an uncollected reservation returns to the pool. */
  expiresAt?: string;
  createdAt: string;
  fulfilledAt?: string;
  resolvedAt?: string;
}

export interface ReserveRewardInput {
  offerId: string;
}
