import type { TrustComponentDTO, TrustComponentKey, TrustLevel } from '@back2u/shared-types';

/**
 * Observable facts about one account. Everything here is a fact the platform
 * already records; nothing accumulates on its own.
 */
export interface TrustSignals {
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  status: 'active' | 'banned' | 'suspended';
  accountAgeDays: number;
  /** Recoveries the platform actually verified. */
  verifiedRecoveries: number;
  /** Of those, how many carried independent evidence (levels B, C or D). */
  strongEvidenceRecoveries: number;
  /** Distinct people this account has recovered with — not raw confirmations. */
  distinctCounterparties: number;
  /** Reviews left by others. */
  reviewCount: number;
  averageRating?: number;
  /** Recoveries a reviewer confirmed as fraudulent. */
  confirmedFraudCount: number;
  /** Awards clawed back after a dispute or reversal. */
  reversalCount: number;
  /** Present only for partner staff (spec §16 "partner integrity"). */
  partner?: {
    /** Releases ÷ deposits at the organisation they work for. */
    depositsToReturnsRatio: number | null;
    /** Custody events that ended in a dispute. */
    custodyDisputes: number;
  };
}

/**
 * Recoveries at which the history component saturates. Past this, another
 * recovery adds nothing — the point of spec §16 is that a user "cannot simply
 * buy trust through activity volume", so the curve has to flatten.
 */
const RECOVERY_SATURATION = 20;
/** Distinct counterparties at which the community component saturates. */
const COUNTERPARTY_SATURATION = 10;
/** Below this age an account has not yet had time to prove itself. */
const PROVING_PERIOD_DAYS = 30;

const WEIGHTS: Record<TrustComponentKey, number> = {
  identity_confidence: 0.15,
  recovery_history: 0.2,
  verification_quality: 0.25,
  account_integrity: 0.2,
  community_history: 0.1,
  partner_integrity: 0.1,
};

const LABELS: Record<TrustComponentKey, string> = {
  identity_confidence: 'Identity confidence',
  recovery_history: 'Recovery history',
  verification_quality: 'Verification quality',
  account_integrity: 'Account integrity',
  community_history: 'Community history',
  partner_integrity: 'Partner integrity',
};

/** Diminishing curve: fast early, flat once `saturation` is reached. */
const saturating = (n: number, saturation: number): number =>
  n <= 0 ? 0 : Math.min(1, Math.log1p(n) / Math.log1p(saturation));

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** Score and the minimum verified recoveries each level demands. */
const LEVEL_GATES: { level: TrustLevel; minScore: number; minRecoveries: number }[] = [
  { level: 'legend', minScore: 90, minRecoveries: 60 },
  { level: 'guardian', minScore: 80, minRecoveries: 30 },
  { level: 'community_hero', minScore: 65, minRecoveries: 15 },
  { level: 'trusted_finder', minScore: 50, minRecoveries: 5 },
  { level: 'helper', minScore: 30, minRecoveries: 1 },
  { level: 'new_finder', minScore: 0, minRecoveries: 0 },
];

export interface TrustScoreResult {
  score: number;
  level: TrustLevel;
  nextLevel?: TrustLevel;
  nextLevelRequirement?: string;
  components: TrustComponentDTO[];
}

/**
 * Computes an account's Trust Score (spec §16).
 *
 * Pure and derived — never accumulated. Trust is recomputed from current facts
 * every time, so it can fall as well as rise, and the components that carry the
 * most weight are RATIOS (what share of this person's recoveries carried real
 * evidence) rather than counts. That is what keeps it separate from BakPoints:
 * doing more of something cannot by itself make you more trustworthy.
 */
export function computeTrustScore(signals: TrustSignals): TrustScoreResult {
  const components: TrustComponentDTO[] = [];

  const add = (key: TrustComponentKey, value: number, detail: string): void => {
    components.push({
      key,
      label: LABELS[key],
      value: clamp01(value),
      weight: WEIGHTS[key],
      detail,
    });
  };

  // ── Identity confidence ────────────────────────────────────────────────
  const identity =
    (signals.emailVerified ? 0.35 : 0) +
    (signals.phoneVerified ? 0.4 : 0) +
    (signals.mfaEnabled ? 0.25 : 0);
  add(
    'identity_confidence',
    identity,
    [
      signals.emailVerified ? 'email verified' : 'email unverified',
      signals.phoneVerified ? 'phone verified' : 'phone unverified',
      signals.mfaEnabled ? 'two-factor on' : 'two-factor off',
    ].join(', '),
  );

  // ── Recovery history ───────────────────────────────────────────────────
  const history = saturating(signals.verifiedRecoveries, RECOVERY_SATURATION);
  add(
    'recovery_history',
    history,
    signals.verifiedRecoveries === 0
      ? 'no verified recoveries yet'
      : `${signals.verifiedRecoveries} verified ${signals.verifiedRecoveries === 1 ? 'recovery' : 'recoveries'}` +
          (signals.verifiedRecoveries >= RECOVERY_SATURATION ? ' (fully credited)' : ''),
  );

  // ── Verification quality ───────────────────────────────────────────────
  // A ratio, so a hundred unwitnessed peer handovers score no better than one.
  const quality =
    signals.verifiedRecoveries > 0
      ? signals.strongEvidenceRecoveries / signals.verifiedRecoveries
      : 0;
  add(
    'verification_quality',
    quality,
    signals.verifiedRecoveries === 0
      ? 'nothing to assess yet'
      : `${signals.strongEvidenceRecoveries} of ${signals.verifiedRecoveries} recoveries had independent evidence`,
  );

  // ── Account integrity ──────────────────────────────────────────────────
  let integrity = 1;
  const integrityNotes: string[] = [];
  if (signals.status !== 'active') {
    integrity = 0;
    integrityNotes.push(`account ${signals.status}`);
  } else {
    if (signals.confirmedFraudCount > 0) {
      integrity -= 0.5 * signals.confirmedFraudCount;
      integrityNotes.push(`${signals.confirmedFraudCount} confirmed fraud`);
    }
    if (signals.reversalCount > 0) {
      integrity -= 0.1 * signals.reversalCount;
      integrityNotes.push(`${signals.reversalCount} reversals`);
    }
    if (signals.accountAgeDays < PROVING_PERIOD_DAYS) {
      // Not a penalty for wrongdoing — a new account simply has not yet had
      // the chance to demonstrate integrity either way.
      integrity *= Math.max(0, signals.accountAgeDays) / PROVING_PERIOD_DAYS;
      integrityNotes.push(`account is ${Math.floor(signals.accountAgeDays)} days old`);
    }
    if (integrityNotes.length === 0) integrityNotes.push('clean record');
  }
  add('account_integrity', integrity, integrityNotes.join(', '));

  // ── Community history ──────────────────────────────────────────────────
  // Distinct counterparties, not confirmations: two people confirming each
  // other repeatedly is the reciprocal farming §16 says to protect against.
  const breadth = saturating(signals.distinctCounterparties, COUNTERPARTY_SATURATION);
  const rating =
    signals.reviewCount > 0 && signals.averageRating !== undefined
      ? clamp01(signals.averageRating / 5)
      : 0;
  const community = signals.reviewCount > 0 ? breadth * 0.6 + rating * 0.4 : breadth * 0.6;
  add(
    'community_history',
    community,
    signals.distinctCounterparties === 0
      ? 'no community history yet'
      : `${signals.distinctCounterparties} distinct people helped` +
          (signals.reviewCount > 0
            ? `, ${signals.averageRating?.toFixed(1)}★ from ${signals.reviewCount} reviews`
            : ''),
  );

  // ── Partner integrity (staff only) ─────────────────────────────────────
  if (signals.partner) {
    const { depositsToReturnsRatio, custodyDisputes } = signals.partner;
    // No deposits yet is neutral, not bad — a new counter starts even.
    let partner = depositsToReturnsRatio === null ? 0.5 : clamp01(depositsToReturnsRatio);
    partner -= 0.2 * custodyDisputes;
    add(
      'partner_integrity',
      partner,
      depositsToReturnsRatio === null
        ? 'no custody activity yet'
        : `${Math.round(depositsToReturnsRatio * 100)}% of deposits returned to owners` +
            (custodyDisputes > 0 ? `, ${custodyDisputes} disputes` : ''),
    );
  }

  // Only components that apply are weighted, so a non-staff account is not
  // penalised for having no partner-integrity signal.
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const weighted = components.reduce((sum, c) => sum + c.value * c.weight, 0);
  const score = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0;

  const level = levelFor(score, signals.verifiedRecoveries);
  const next = nextLevelFor(level);

  return {
    score,
    level,
    nextLevel: next?.level,
    nextLevelRequirement: next
      ? requirementText(next, score, signals.verifiedRecoveries)
      : undefined,
    components,
  };
}

/** The highest level whose score AND track-record gates are both met. */
export function levelFor(score: number, verifiedRecoveries: number): TrustLevel {
  for (const gate of LEVEL_GATES) {
    if (score >= gate.minScore && verifiedRecoveries >= gate.minRecoveries) return gate.level;
  }
  return 'new_finder';
}

function nextLevelFor(
  current: TrustLevel,
): { level: TrustLevel; minScore: number; minRecoveries: number } | undefined {
  const ascending = [...LEVEL_GATES].reverse();
  const index = ascending.findIndex((g) => g.level === current);
  return index >= 0 ? ascending[index + 1] : undefined;
}

function requirementText(
  gate: { level: TrustLevel; minScore: number; minRecoveries: number },
  score: number,
  recoveries: number,
): string {
  const missing: string[] = [];
  if (score < gate.minScore) missing.push(`a Trust Score of ${gate.minScore}`);
  if (recoveries < gate.minRecoveries) {
    missing.push(`${gate.minRecoveries - recoveries} more verified recoveries`);
  }
  return missing.length > 0 ? `Needs ${missing.join(' and ')}.` : 'Ready to advance.';
}
