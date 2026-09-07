import type { RiskBand } from './enums.js';

/**
 * Deterministic anti-collusion signals. The spec is explicit that the weights
 * behind these must not be exposed publicly (§6), so rule hits and scores are
 * admin-only — never part of any user- or partner-facing payload.
 */
export type RiskRuleCode =
  | 'repeat_pair'
  | 'reciprocal_recovery'
  | 'shared_device'
  | 'shared_payout'
  | 'new_account'
  | 'fast_turnaround'
  | 'high_value_frequency'
  | 'duplicate_media'
  | 'partner_concentration'
  | 'dispute_history'
  | 'peer_only_high_value';

export interface RiskRuleHitDTO {
  code: RiskRuleCode;
  weight: number;
  detail: string;
}

/** What the engine decided to do with the rewards attached to a recovery. */
export type RiskAction =
  /** Normal workflow; clear after the standard pending period. */
  | 'clear'
  /** Extend the reward delay and apply additional verification. */
  | 'extend_hold'
  /** Manual Trust & Safety review before rewards clear. */
  | 'manual_review'
  /** Freeze reward/points and investigate linked accounts. */
  | 'freeze';

export type RiskReviewStatus = 'open' | 'cleared' | 'confirmed_fraud' | 'dismissed';

export interface RiskAssessmentDTO {
  id: string;
  /** Recovery this score belongs to — a match id today. */
  subjectId: string;
  ownerId: string;
  finderId: string;
  /** 0–100. Higher is riskier. */
  score: number;
  band: RiskBand;
  action: RiskAction;
  ruleHits: RiskRuleHitDTO[];
  reviewStatus: RiskReviewStatus;
  reviewerId?: string;
  reviewerNote?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface ReviewRiskAssessmentInput {
  decision: Exclude<RiskReviewStatus, 'open'>;
  note?: string;
}
