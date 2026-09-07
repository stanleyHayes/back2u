import type { PointAction, PointAwardReason, VerificationLevel } from '@back2u/shared-types';

import type { BusinessRules } from '../rules/business-rules.entity.js';

const MS_PER_DAY = 86_400_000;

/** Everything the policy needs to price one award. All of it is caller-supplied. */
export interface AwardContext {
  action: PointAction;
  /** Evidence path behind the recovery; omitted for non-recovery actions. */
  verificationLevel?: VerificationLevel;
  /** Item category, used for the admin-configured category bonus. */
  category?: string;
  /** Prior cleared/pending recoveries between this user and the counterparty. */
  priorPairCount: number;
  /** This user's recoveries in a rolling 30 days, for diminishing returns. */
  recoveriesLast30d: number;
  /** Age of the earning account in days. */
  accountAgeDays: number;
  /** Points already earned (pending + cleared) in each rolling cap window. */
  earnedToday: number;
  earnedThisWeek: number;
  earnedThisMonth: number;
  /** Extra hold requested by the risk engine, in days. */
  extraHoldDays?: number;
  now: Date;
}

export interface AwardComputation {
  basePoints: number;
  /** Product of every multiplier applied, rounded to 2dp. */
  multiplier: number;
  /** Final signed award after multipliers, penalties and caps. */
  points: number;
  reasons: PointAwardReason[];
  pendingUntil: Date;
}

/**
 * Prices a single BakPoints award against the admin-editable rules.
 *
 * Pure and deterministic — the anti-gaming controls in spec §7 (verification
 * weighting, repeat-pair penalty, diminishing returns, rolling caps, new-account
 * delay) all land here so they are testable in isolation and cannot be bypassed
 * by a caller that forgets one of them.
 */
export function computeAward(ctx: AwardContext, rules: BusinessRules): AwardComputation {
  const r = rules.snapshot;
  const reasons: PointAwardReason[] = [];

  const configured = r.pointsPerAction[ctx.action] ?? 0;
  const categoryBonus = ctx.category ? (r.categoryBonus[ctx.category] ?? 0) : 0;
  const basePoints = configured + categoryBonus;

  reasons.push({ code: 'base', detail: `${configured} points for ${ctx.action}` });
  if (categoryBonus > 0) {
    reasons.push({
      code: 'category_bonus',
      detail: `+${categoryBonus} category bonus for ${ctx.category}`,
    });
  }

  let multiplier = 1;

  // §5 — a peer-only handover is worth less than partner or institutional custody.
  if (ctx.verificationLevel) {
    const levelMultiplier = rules.multiplierFor(ctx.verificationLevel);
    multiplier *= levelMultiplier;
    reasons.push({
      code: 'verification_multiplier',
      detail: `×${levelMultiplier} for ${ctx.verificationLevel} verification`,
    });
  }

  // §7 — reduce rewards for repeated recoveries between the same pair.
  if (ctx.priorPairCount > r.repeatPairFreeCount) {
    multiplier *= r.repeatPairPenalty;
    reasons.push({
      code: 'repeat_pair_penalty',
      detail: `×${r.repeatPairPenalty} — ${ctx.priorPairCount} prior recoveries with this counterparty`,
    });
  }

  // §7 — diminishing returns for unusually frequent consumer recoveries.
  if (r.diminishingReturnsAfter > 0 && ctx.recoveriesLast30d >= r.diminishingReturnsAfter) {
    multiplier *= r.diminishingReturnsFactor;
    reasons.push({
      code: 'diminishing_returns',
      detail: `×${r.diminishingReturnsFactor} — ${ctx.recoveriesLast30d} recoveries in the last 30 days`,
    });
  }

  const campaign = rules.campaignMultiplierAt(ctx.now);
  if (campaign !== 1) {
    multiplier *= campaign;
    reasons.push({ code: 'campaign_multiplier', detail: `×${campaign} campaign boost` });
  }

  let points = Math.round(basePoints * multiplier);

  // §7 — daily, weekly and monthly caps. `0` disables a cap.
  const caps: [PointAwardReason['code'], number, number][] = [
    ['daily_cap', r.dailyPointCap, ctx.earnedToday],
    ['weekly_cap', r.weeklyPointCap, ctx.earnedThisWeek],
    ['monthly_cap', r.monthlyPointCap, ctx.earnedThisMonth],
  ];
  for (const [code, cap, earned] of caps) {
    if (cap <= 0) continue;
    const headroom = Math.max(0, cap - earned);
    if (points > headroom) {
      reasons.push({
        code,
        detail: `capped at ${headroom} — ${earned}/${cap} already earned in this window`,
      });
      points = headroom;
    }
  }

  // §4 + §7 — standard holding period, extended for new accounts and risk holds.
  let holdDays = r.pointsPendingDays;
  if (ctx.accountAgeDays < r.newAccountMinAgeDays) {
    holdDays += r.newAccountRewardDelayDays;
    reasons.push({
      code: 'new_account_delay',
      detail: `+${r.newAccountRewardDelayDays} days — account is ${Math.floor(ctx.accountAgeDays)} days old`,
    });
  }
  if (ctx.extraHoldDays && ctx.extraHoldDays > 0) {
    holdDays += ctx.extraHoldDays;
    // §6 keeps the scoring private, and this reason is shown to the earner.
    // Saying the recovery was flagged would tell a colluding pair that the
    // engine noticed them, so the wording states the effect, not the cause.
    reasons.push({
      code: 'risk_hold',
      detail: `Extended review period: available in ${holdDays} days`,
    });
  }

  return {
    basePoints,
    multiplier: Math.round(multiplier * 100) / 100,
    points,
    reasons,
    pendingUntil: new Date(ctx.now.getTime() + holdDays * MS_PER_DAY),
  };
}

/** Maps an item category onto the recovery action whose points it earns. (§3) */
export function recoveryActionForCategory(category: string | undefined): PointAction {
  const c = (category ?? '').toLowerCase();
  if (/phone|laptop|tablet|computer|electronic|device/.test(c)) return 'recovery_device';
  if (/id|document|passport|licen[cs]e|card|certificate/.test(c)) return 'recovery_document';
  return 'recovery_ordinary';
}
