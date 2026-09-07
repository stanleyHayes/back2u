import type {
  BusinessRulesDTO,
  PointAction,
  UpdateBusinessRulesInput,
  VerificationLevel,
} from '@back2u/shared-types';

import { ValidationError } from '../shared/errors.js';

/** There is only ever one business-rules document. */
export const BUSINESS_RULES_ID = 'singleton';

export interface BusinessRulesSnapshot {
  id: string;
  pointsPerAction: Record<PointAction, number>;
  categoryBonus: Record<string, number>;
  pointsPendingDays: number;
  riskExtendedPendingDays: number;
  dailyPointCap: number;
  weeklyPointCap: number;
  monthlyPointCap: number;
  verificationMultipliers: Record<VerificationLevel, number>;
  repeatPairFreeCount: number;
  repeatPairPenalty: number;
  diminishingReturnsAfter: number;
  diminishingReturnsFactor: number;
  newAccountMinAgeDays: number;
  newAccountRewardDelayDays: number;
  highValueThresholdMinor: number;
  riskThresholds: { mediumFrom: number; highFrom: number; criticalFrom: number };
  rewardPlatformFeeRate: number;
  campaignMultiplier: number;
  campaignStartsAt?: Date;
  campaignEndsAt?: Date;
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * Launch defaults, taken from the illustrative tables in the specification
 * (§3 points, §4 holding period, §5 multipliers, §6 risk thresholds, §7 caps).
 * These are a starting point to be tuned from pilot data (§22) — never a
 * constant to read from code. Always resolve rules through the repository.
 */
export const DEFAULT_BUSINESS_RULES: Omit<BusinessRulesSnapshot, 'updatedAt'> = {
  id: BUSINESS_RULES_ID,
  pointsPerAction: {
    profile_completed: 10,
    found_item_reported: 5,
    recovery_point_deposit: 10,
    recovery_ordinary: 25,
    recovery_document: 30,
    recovery_device: 40,
    owner_confirmed_recovery: 10,
    milestone_bonus: 50,
    // Signed by the caller; the configured magnitude is what a confirmed
    // fraudulent recovery costs. (§3: −100 / freeze.)
    fraud_penalty: 100,
    redemption_spend: 0,
    admin_adjustment: 0,
  },
  categoryBonus: {},
  pointsPendingDays: 7,
  riskExtendedPendingDays: 14,
  dailyPointCap: 120,
  weeklyPointCap: 400,
  monthlyPointCap: 1200,
  verificationMultipliers: {
    peer: 0.5,
    recovery_point: 1,
    verified_delivery: 1,
    institutional: 1.25,
  },
  repeatPairFreeCount: 1,
  repeatPairPenalty: 0.5,
  diminishingReturnsAfter: 8,
  diminishingReturnsFactor: 0.5,
  newAccountMinAgeDays: 7,
  newAccountRewardDelayDays: 7,
  highValueThresholdMinor: 100_000,
  riskThresholds: { mediumFrom: 31, highFrom: 61, criticalFrom: 81 },
  rewardPlatformFeeRate: 0.1,
  campaignMultiplier: 1,
};

function assertRange(label: string, value: number, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(`${label} must be between ${min} and ${max}`);
  }
}

export class BusinessRules {
  private constructor(private state: BusinessRulesSnapshot) {}

  static rehydrate(s: BusinessRulesSnapshot): BusinessRules {
    // Merge over defaults so a document written before a new knob existed
    // still resolves that knob instead of yielding `undefined` at award time.
    return new BusinessRules({
      ...DEFAULT_BUSINESS_RULES,
      ...s,
      pointsPerAction: {
        ...DEFAULT_BUSINESS_RULES.pointsPerAction,
        ...(s.pointsPerAction ?? {}),
      },
      verificationMultipliers: {
        ...DEFAULT_BUSINESS_RULES.verificationMultipliers,
        ...(s.verificationMultipliers ?? {}),
      },
      riskThresholds: { ...DEFAULT_BUSINESS_RULES.riskThresholds, ...(s.riskThresholds ?? {}) },
      categoryBonus: { ...(s.categoryBonus ?? {}) },
    });
  }

  static createDefault(): BusinessRules {
    return new BusinessRules({ ...DEFAULT_BUSINESS_RULES, updatedAt: new Date() });
  }

  get snapshot(): BusinessRulesSnapshot {
    return { ...this.state };
  }

  /** Multiplier for the given evidence path, defaulting to the weakest. */
  multiplierFor(level: VerificationLevel): number {
    return this.state.verificationMultipliers[level] ?? this.state.verificationMultipliers.peer;
  }

  /** The campaign boost, but only inside its configured window. */
  campaignMultiplierAt(now: Date): number {
    const { campaignStartsAt, campaignEndsAt, campaignMultiplier } = this.state;
    if (campaignStartsAt && now < campaignStartsAt) return 1;
    if (campaignEndsAt && now > campaignEndsAt) return 1;
    return campaignMultiplier;
  }

  update(input: UpdateBusinessRulesInput, actorId?: string): void {
    const next: BusinessRulesSnapshot = { ...this.state };

    if (input.pointsPerAction) {
      for (const [action, points] of Object.entries(input.pointsPerAction)) {
        assertRange(`pointsPerAction.${action}`, points, 0, 100_000);
      }
      next.pointsPerAction = { ...next.pointsPerAction, ...input.pointsPerAction };
    }
    if (input.categoryBonus) {
      for (const [category, points] of Object.entries(input.categoryBonus)) {
        assertRange(`categoryBonus.${category}`, points, 0, 100_000);
      }
      next.categoryBonus = { ...next.categoryBonus, ...input.categoryBonus };
    }
    if (input.verificationMultipliers) {
      for (const [level, m] of Object.entries(input.verificationMultipliers)) {
        assertRange(`verificationMultipliers.${level}`, m, 0, 10);
      }
      next.verificationMultipliers = {
        ...next.verificationMultipliers,
        ...input.verificationMultipliers,
      };
    }
    if (input.riskThresholds) {
      const t = { ...next.riskThresholds, ...input.riskThresholds };
      assertRange('riskThresholds.mediumFrom', t.mediumFrom, 1, 100);
      assertRange('riskThresholds.highFrom', t.highFrom, 1, 100);
      assertRange('riskThresholds.criticalFrom', t.criticalFrom, 1, 100);
      if (!(t.mediumFrom < t.highFrom && t.highFrom < t.criticalFrom)) {
        throw new ValidationError(
          'riskThresholds must increase: mediumFrom < highFrom < criticalFrom',
        );
      }
      next.riskThresholds = t;
    }

    const numbers: [keyof UpdateBusinessRulesInput, number, number][] = [
      ['pointsPendingDays', 0, 365],
      ['riskExtendedPendingDays', 0, 365],
      ['dailyPointCap', 0, 1_000_000],
      ['weeklyPointCap', 0, 1_000_000],
      ['monthlyPointCap', 0, 1_000_000],
      ['repeatPairFreeCount', 0, 1000],
      ['repeatPairPenalty', 0, 1],
      ['diminishingReturnsAfter', 0, 10_000],
      ['diminishingReturnsFactor', 0, 1],
      ['newAccountMinAgeDays', 0, 365],
      ['newAccountRewardDelayDays', 0, 365],
      ['highValueThresholdMinor', 0, 1_000_000_000],
      ['rewardPlatformFeeRate', 0, 1],
      ['campaignMultiplier', 0, 10],
    ];
    for (const [key, min, max] of numbers) {
      const value = input[key];
      if (value === undefined) continue;
      assertRange(String(key), value as number, min, max);
      (next as unknown as Record<string, unknown>)[key] = value;
    }

    if (input.campaignStartsAt !== undefined) {
      next.campaignStartsAt = input.campaignStartsAt ? new Date(input.campaignStartsAt) : undefined;
    }
    if (input.campaignEndsAt !== undefined) {
      next.campaignEndsAt = input.campaignEndsAt ? new Date(input.campaignEndsAt) : undefined;
    }
    if (
      next.campaignStartsAt &&
      next.campaignEndsAt &&
      next.campaignStartsAt > next.campaignEndsAt
    ) {
      throw new ValidationError('campaignStartsAt must be before campaignEndsAt');
    }

    next.updatedAt = new Date();
    next.updatedBy = actorId;
    this.state = next;
  }
}

export function toBusinessRulesDTO(r: BusinessRules): BusinessRulesDTO {
  const s = r.snapshot;
  return {
    pointsPerAction: s.pointsPerAction,
    categoryBonus: s.categoryBonus,
    pointsPendingDays: s.pointsPendingDays,
    riskExtendedPendingDays: s.riskExtendedPendingDays,
    dailyPointCap: s.dailyPointCap,
    weeklyPointCap: s.weeklyPointCap,
    monthlyPointCap: s.monthlyPointCap,
    verificationMultipliers: s.verificationMultipliers,
    repeatPairFreeCount: s.repeatPairFreeCount,
    repeatPairPenalty: s.repeatPairPenalty,
    diminishingReturnsAfter: s.diminishingReturnsAfter,
    diminishingReturnsFactor: s.diminishingReturnsFactor,
    newAccountMinAgeDays: s.newAccountMinAgeDays,
    newAccountRewardDelayDays: s.newAccountRewardDelayDays,
    highValueThresholdMinor: s.highValueThresholdMinor,
    riskThresholds: s.riskThresholds,
    rewardPlatformFeeRate: s.rewardPlatformFeeRate,
    campaignMultiplier: s.campaignMultiplier,
    campaignStartsAt: s.campaignStartsAt?.toISOString(),
    campaignEndsAt: s.campaignEndsAt?.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    updatedBy: s.updatedBy,
  };
}
