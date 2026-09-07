import type { VerificationLevel } from './enums.js';
import type { PointAction } from './points.js';

/**
 * The admin-editable economics of the platform. Spec §18 is explicit that none
 * of this may be hardcoded: every points value, multiplier, cap, delay and risk
 * threshold is a single stored document that Trust & Safety can retune.
 *
 * There is exactly one of these (id `singleton`).
 */
export interface BusinessRulesDTO {
  /** Base BakPoints for each verified action, before multipliers. (§3) */
  pointsPerAction: Record<PointAction, number>;
  /** Extra flat points for specific item categories, keyed by category slug. */
  categoryBonus: Record<string, number>;

  /** Days a credit stays pending before it can clear. (§4: 7–14 recommended.) */
  pointsPendingDays: number;
  /** Extra pending days applied when the risk engine says `extend_hold`. */
  riskExtendedPendingDays: number;

  /** Rolling earning caps. `0` disables a cap. (§7) */
  dailyPointCap: number;
  weeklyPointCap: number;
  monthlyPointCap: number;

  /** Reward weighting per evidence path. (§5) */
  verificationMultipliers: Record<VerificationLevel, number>;

  /** Recoveries with the same counterparty that are exempt from the penalty. */
  repeatPairFreeCount: number;
  /** Multiplier applied per repeat recovery beyond the free count. (§7, §18) */
  repeatPairPenalty: number;

  /** Recoveries in a rolling 30 days before diminishing returns kick in. (§7) */
  diminishingReturnsAfter: number;
  /** Multiplier applied once past `diminishingReturnsAfter`. */
  diminishingReturnsFactor: number;

  /** Accounts younger than this get their rewards held longer. (§7, §18) */
  newAccountMinAgeDays: number;
  /** Extra pending days applied to a new account's rewards. */
  newAccountRewardDelayDays: number;

  /** Item value (minor units) above which enhanced verification applies. (§18) */
  highValueThresholdMinor: number;

  /** Lower bound of each risk band; below `mediumFrom` is low risk. (§6) */
  riskThresholds: {
    mediumFrom: number;
    highFrom: number;
    criticalFrom: number;
  };

  /** Platform fee taken from an owner-funded cash reward (0–1). (§14, §18) */
  rewardPlatformFeeRate: number;

  /** Temporary partner- or sponsor-funded boost across all awards. (§18) */
  campaignMultiplier: number;
  /** Optional window the campaign multiplier applies in. */
  campaignStartsAt?: string;
  campaignEndsAt?: string;

  updatedAt: string;
  updatedBy?: string;
}

/**
 * Every field is optional — admins PATCH the slice they are retuning, and the
 * nested groups merge field-by-field over the stored document.
 */
export type UpdateBusinessRulesInput = Partial<
  Omit<
    BusinessRulesDTO,
    'updatedAt' | 'updatedBy' | 'riskThresholds' | 'verificationMultipliers' | 'pointsPerAction'
  >
> & {
  pointsPerAction?: Partial<BusinessRulesDTO['pointsPerAction']>;
  verificationMultipliers?: Partial<BusinessRulesDTO['verificationMultipliers']>;
  riskThresholds?: Partial<BusinessRulesDTO['riskThresholds']>;
};
