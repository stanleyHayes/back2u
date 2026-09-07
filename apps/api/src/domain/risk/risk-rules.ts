import type { RiskAction, RiskBand, RiskRuleCode, RiskRuleHitDTO } from '@back2u/shared-types';

import type { BusinessRules } from '../rules/business-rules.entity.js';

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

/**
 * Observable facts about one recovery, gathered by the caller. Deliberately
 * plain data so the engine stays pure and unit-testable, and so the statistical
 * / ML models of spec §21 phase 3 can consume the same shape later.
 */
export interface RecoveryRiskSignals {
  ownerId: string;
  finderId: string;
  /** Prior completed recoveries between exactly this pair. */
  priorPairCount: number;
  /** Prior recoveries where the roles were swapped — reciprocal farming. */
  reciprocalCount: number;
  /** Owner and finder share a device fingerprint or session identifier. */
  sharedDevice: boolean;
  /** Owner and finder share a mobile-money payout destination. */
  sharedPayoutAccount: boolean;
  /** Age of the younger of the two accounts, in days. */
  youngestAccountAgeDays: number;
  /** Hours between the loss report and the matching found report. */
  hoursBetweenReports: number;
  /** Finder's reward-bearing recoveries above the high-value threshold in 30d. */
  highValueRecoveriesLast30d: number;
  /** Perceptual-hash or description collision with an earlier listing. */
  duplicateMedia: boolean;
  /** Share (0–1) of the finder's recoveries flowing through one partner. */
  partnerConcentration: number;
  /** Disputes, reversals or ownership failures involving either party. */
  disputeCount: number;
  /** Declared item value in minor units, when known. */
  itemValueMinor?: number;
  /** True when the return had no independent evidence (§5 level A). */
  peerOnlyReturn: boolean;
}

/**
 * Weights behind the Recovery Risk Score. Spec §6 requires these stay private —
 * they are never serialised into a user- or partner-facing payload, and the
 * routes that expose assessments are admin-only.
 */
const WEIGHTS: Record<RiskRuleCode, number> = {
  repeat_pair: 22,
  reciprocal_recovery: 25,
  shared_device: 30,
  shared_payout: 28,
  new_account: 14,
  fast_turnaround: 12,
  high_value_frequency: 16,
  duplicate_media: 15,
  partner_concentration: 12,
  dispute_history: 18,
  peer_only_high_value: 20,
};

/** Below this many hours between loss and found report looks manufactured. */
const FAST_TURNAROUND_HOURS = 2;
/** More than this many high-value recoveries in 30 days is a farming signal. */
const HIGH_VALUE_FREQUENCY_LIMIT = 3;
/** Share of a finder's recoveries through one partner that looks like collusion. */
const PARTNER_CONCENTRATION_LIMIT = 0.8;

export interface RiskEvaluation {
  /** 0–100, higher is riskier. */
  score: number;
  band: RiskBand;
  action: RiskAction;
  ruleHits: RiskRuleHitDTO[];
}

/**
 * Scores one recovery against the deterministic anti-collusion rules of §6.
 *
 * The central abuse case the spec names is an owner handing an item to a friend
 * and manufacturing a recovery, so the heaviest weights sit on the signals that
 * betray a relationship: a shared device, a shared payout destination, and
 * repeated or reciprocal pairings.
 */
export function evaluateRecoveryRisk(
  signals: RecoveryRiskSignals,
  rules: BusinessRules,
): RiskEvaluation {
  const r = rules.snapshot;
  const hits: RiskRuleHitDTO[] = [];

  const hit = (code: RiskRuleCode, detail: string): void => {
    hits.push({ code, weight: WEIGHTS[code], detail });
  };

  // An owner and finder who keep meeting are the spec's primary abuse case.
  if (signals.priorPairCount > r.repeatPairFreeCount) {
    hit('repeat_pair', `${signals.priorPairCount} prior recoveries between this owner and finder`);
  }
  if (signals.reciprocalCount > 0) {
    hit(
      'reciprocal_recovery',
      `${signals.reciprocalCount} prior recoveries with the roles reversed`,
    );
  }
  if (signals.sharedDevice) {
    hit('shared_device', 'Owner and finder share a device or session fingerprint');
  }
  if (signals.sharedPayoutAccount) {
    hit('shared_payout', 'Owner and finder share a payout destination');
  }
  if (signals.youngestAccountAgeDays < r.newAccountMinAgeDays) {
    hit(
      'new_account',
      `An account involved is ${Math.floor(signals.youngestAccountAgeDays)} days old`,
    );
  }
  if (signals.hoursBetweenReports >= 0 && signals.hoursBetweenReports < FAST_TURNAROUND_HOURS) {
    hit(
      'fast_turnaround',
      `Found report filed ${signals.hoursBetweenReports.toFixed(1)}h after the loss report`,
    );
  }
  if (signals.highValueRecoveriesLast30d > HIGH_VALUE_FREQUENCY_LIMIT) {
    hit(
      'high_value_frequency',
      `${signals.highValueRecoveriesLast30d} high-value recoveries in the last 30 days`,
    );
  }
  if (signals.duplicateMedia) {
    hit('duplicate_media', 'Images or description reused from an earlier listing');
  }
  if (signals.partnerConcentration >= PARTNER_CONCENTRATION_LIMIT) {
    hit(
      'partner_concentration',
      `${Math.round(signals.partnerConcentration * 100)}% of this finder's recoveries run through one partner`,
    );
  }
  if (signals.disputeCount > 0) {
    hit('dispute_history', `${signals.disputeCount} prior disputes, reversals or claim failures`);
  }
  // §7 — never pay a substantial reward on two-party self-confirmation alone.
  if (
    signals.peerOnlyReturn &&
    signals.itemValueMinor !== undefined &&
    signals.itemValueMinor >= r.highValueThresholdMinor
  ) {
    hit('peer_only_high_value', 'High-value item returned with no independent evidence');
  }

  const score = Math.min(
    100,
    hits.reduce((sum, h) => sum + h.weight, 0),
  );
  const band = bandFor(score, r.riskThresholds);
  return { score, band, action: actionFor(band), ruleHits: hits };
}

export function bandFor(
  score: number,
  thresholds: { mediumFrom: number; highFrom: number; criticalFrom: number },
): RiskBand {
  if (score >= thresholds.criticalFrom) return 'critical';
  if (score >= thresholds.highFrom) return 'high';
  if (score >= thresholds.mediumFrom) return 'medium';
  return 'low';
}

/** Default action per band, straight from the §6 response table. */
export function actionFor(band: RiskBand): RiskAction {
  switch (band) {
    case 'critical':
      return 'freeze';
    case 'high':
      return 'manual_review';
    case 'medium':
      return 'extend_hold';
    default:
      return 'clear';
  }
}

export const riskHelpers = {
  hoursBetween(a: Date, b: Date): number {
    return Math.abs(a.getTime() - b.getTime()) / MS_PER_HOUR;
  },
  daysSince(d: Date, now: Date): number {
    return (now.getTime() - d.getTime()) / MS_PER_DAY;
  },
};
