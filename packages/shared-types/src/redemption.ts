import type { SupportedCurrency } from './currency.js';

export type RedemptionStatus = 'pending' | 'fulfilled' | 'cancelled';

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
  createdAt: string;
  fulfilledAt?: string;
}
