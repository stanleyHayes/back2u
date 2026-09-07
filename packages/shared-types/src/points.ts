import type { PointEntryStatus, VerificationLevel } from './enums.js';

/**
 * Every way BakPoints can enter or leave the ledger. Point values are not
 * hardcoded against these keys — they live in `BusinessRulesDTO.pointsPerAction`
 * so admins can retune the economy without a deploy. (Spec §3, §18.)
 */
export type PointAction =
  | 'profile_completed'
  | 'found_item_reported'
  | 'recovery_point_deposit'
  | 'recovery_ordinary'
  | 'recovery_document'
  | 'recovery_device'
  | 'owner_confirmed_recovery'
  | 'milestone_bonus'
  | 'fraud_penalty'
  | 'redemption_spend'
  | 'admin_adjustment';

export const POINT_ACTIONS: readonly PointAction[] = [
  'profile_completed',
  'found_item_reported',
  'recovery_point_deposit',
  'recovery_ordinary',
  'recovery_document',
  'recovery_device',
  'owner_confirmed_recovery',
  'milestone_bonus',
  'fraud_penalty',
  'redemption_spend',
  'admin_adjustment',
];

/** Why an award ended up at the points it did — shown to the user verbatim. */
export interface PointAwardReason {
  code:
    | 'base'
    | 'verification_multiplier'
    | 'category_bonus'
    | 'campaign_multiplier'
    | 'repeat_pair_penalty'
    | 'diminishing_returns'
    | 'daily_cap'
    | 'weekly_cap'
    | 'monthly_cap'
    | 'new_account_delay'
    | 'risk_hold';
  detail: string;
}

/**
 * One immutable credit/debit. `points` is signed and never changes after
 * creation; the lifecycle lives in `status`. (Spec §19 `point_ledger`.)
 */
export interface PointLedgerEntryDTO {
  id: string;
  userId: string;
  action: PointAction;
  /** Signed award actually granted, after multipliers, penalties and caps. */
  points: number;
  /** Configured value before any multiplier or cap was applied. */
  basePoints: number;
  /** Product of every multiplier applied to `basePoints`, rounded to 2dp. */
  multiplier: number;
  status: PointEntryStatus;
  verificationLevel?: VerificationLevel;
  /** Recovery this entry belongs to, when there is one (a match id today). */
  caseRef?: string;
  itemId?: string;
  /** Counterparty on the recovery — used for repeat-pair detection. */
  counterpartyId?: string;
  reasons: PointAwardReason[];
  /** When a pending entry becomes eligible to clear. */
  pendingUntil?: string;
  clearedAt?: string;
  reversedAt?: string;
  /** Set when the entry is reversed or cancelled. */
  resolutionNote?: string;
  createdAt: string;
}

/** A user's own view of their BakPoints. Never exposes risk internals. */
export interface PointsSummaryDTO {
  /** Spendable now. Mirrors `UserDTO.pointsBalance`. */
  balance: number;
  /** Earned but still inside the holding period. */
  pending: number;
  /** Sum of every cleared credit ever granted. */
  lifetimeEarned: number;
  /** Sum of every reversed credit. */
  reversed: number;
  /** Points earned (pending + cleared) inside the rolling cap windows. */
  earnedToday: number;
  earnedThisWeek: number;
  earnedThisMonth: number;
}

export interface AdjustPointsInput {
  userId: string;
  points: number;
  note: string;
}
