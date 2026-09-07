import type {
  RiskAction,
  RiskAssessmentDTO,
  RiskBand,
  RiskReviewStatus,
  RiskRuleHitDTO,
} from '@back2u/shared-types';

import { ConflictError } from '../shared/errors.js';
import type { Id } from '../shared/id.js';

export interface RiskAssessmentSnapshot {
  id: Id;
  /** The recovery being scored — a match id today. */
  subjectId: Id;
  ownerId: Id;
  finderId: Id;
  score: number;
  band: RiskBand;
  action: RiskAction;
  ruleHits: RiskRuleHitDTO[];
  reviewStatus: RiskReviewStatus;
  reviewerId?: Id;
  reviewerNote?: string;
  createdAt: Date;
  decidedAt?: Date;
}

/**
 * A private Recovery Risk Score plus the rules that produced it (§6). Kept as
 * its own record so Trust & Safety can audit why a reward was held long after
 * the rules that scored it were retuned.
 */
export class RiskAssessment {
  private constructor(private state: RiskAssessmentSnapshot) {}

  static rehydrate(s: RiskAssessmentSnapshot): RiskAssessment {
    return new RiskAssessment({ ...s });
  }

  static record(input: {
    id: Id;
    subjectId: Id;
    ownerId: Id;
    finderId: Id;
    score: number;
    band: RiskBand;
    action: RiskAction;
    ruleHits: RiskRuleHitDTO[];
  }): RiskAssessment {
    return new RiskAssessment({
      ...input,
      // Only bands that stop the normal workflow need a human to close them out.
      reviewStatus: input.action === 'clear' || input.action === 'extend_hold' ? 'cleared' : 'open',
      createdAt: new Date(),
      decidedAt:
        input.action === 'clear' || input.action === 'extend_hold' ? new Date() : undefined,
    });
  }

  get id(): Id {
    return this.state.id;
  }
  get snapshot(): RiskAssessmentSnapshot {
    return { ...this.state, ruleHits: [...this.state.ruleHits] };
  }
  get action(): RiskAction {
    return this.state.action;
  }
  get band(): RiskBand {
    return this.state.band;
  }

  /** True while rewards on this recovery must not clear. */
  get blocksRewards(): boolean {
    return (
      (this.state.action === 'manual_review' || this.state.action === 'freeze') &&
      this.state.reviewStatus === 'open'
    );
  }

  review(decision: Exclude<RiskReviewStatus, 'open'>, reviewerId: Id, note?: string): void {
    if (this.state.reviewStatus !== 'open') {
      throw new ConflictError('Risk assessment has already been reviewed');
    }
    this.state.reviewStatus = decision;
    this.state.reviewerId = reviewerId;
    this.state.reviewerNote = note;
    this.state.decidedAt = new Date();
  }
}

export function toRiskAssessmentDTO(a: RiskAssessment): RiskAssessmentDTO {
  const s = a.snapshot;
  return {
    id: s.id,
    subjectId: s.subjectId,
    ownerId: s.ownerId,
    finderId: s.finderId,
    score: s.score,
    band: s.band,
    action: s.action,
    ruleHits: s.ruleHits,
    reviewStatus: s.reviewStatus,
    reviewerId: s.reviewerId,
    reviewerNote: s.reviewerNote,
    createdAt: s.createdAt.toISOString(),
    decidedAt: s.decidedAt?.toISOString(),
  };
}
