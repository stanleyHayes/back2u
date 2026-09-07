import type { ReviewRiskAssessmentInput, RiskAssessmentDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import { toRiskAssessmentDTO } from '../../../domain/risk/risk-assessment.entity.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IRiskAssessmentRepository } from '../../ports/points-repos.js';
import type { IAuditLogRepository } from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { ApplyFraudPenaltyUseCase, ReverseCasePointsUseCase } from '../points/points.use-cases.js';
import { RecomputeTrustScoreUseCase } from '../trust/trust-score.use-cases.js';

/** The Trust & Safety queue of spec §17 — admin-only, riskiest first. */
@injectable()
export class ListOpenRiskAssessmentsUseCase {
  constructor(
    @inject(TOKENS.RiskAssessmentRepository) private readonly risks: IRiskAssessmentRepository,
  ) {}

  async execute(opts: {
    limit: number;
    skip: number;
  }): Promise<{ items: RiskAssessmentDTO[]; total: number }> {
    const { items, total } = await this.risks.listOpen(opts.limit, opts.skip);
    return { items: items.map(toRiskAssessmentDTO), total };
  }
}

@injectable()
export class GetRiskAssessmentUseCase {
  constructor(
    @inject(TOKENS.RiskAssessmentRepository) private readonly risks: IRiskAssessmentRepository,
  ) {}

  async execute(id: Id): Promise<RiskAssessmentDTO> {
    const assessment = await this.risks.findById(id);
    if (!assessment) throw new NotFoundError('Risk assessment');
    return toRiskAssessmentDTO(assessment);
  }
}

/**
 * Closes out a held recovery. Confirming fraud reverses every BakPoints entry on
 * the case and penalises both participants — the spec treats manufactured
 * recoveries as a two-party act (§6), and a penalty on the finder alone would
 * leave the colluding owner untouched.
 */
@injectable()
export class ReviewRiskAssessmentUseCase {
  constructor(
    @inject(TOKENS.RiskAssessmentRepository) private readonly risks: IRiskAssessmentRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(ReverseCasePointsUseCase) private readonly reverseCase: ReverseCasePointsUseCase,
    @inject(ApplyFraudPenaltyUseCase) private readonly penalise: ApplyFraudPenaltyUseCase,
    @inject(RecomputeTrustScoreUseCase) private readonly trust: RecomputeTrustScoreUseCase,
  ) {}

  async execute(
    id: Id,
    reviewerId: Id,
    input: ReviewRiskAssessmentInput,
  ): Promise<RiskAssessmentDTO> {
    const assessment = await this.risks.findById(id);
    if (!assessment) throw new NotFoundError('Risk assessment');

    const s = assessment.snapshot;
    if (input.decision === 'confirmed_fraud') {
      const note = input.note ?? `Confirmed fraudulent recovery ${s.subjectId}`;
      // Do the clawback BEFORE closing the review: closing it lifts the payout
      // block, so a failure here must leave the case open rather than freeing
      // the money and losing the penalty.
      await this.reverseCase.execute(s.subjectId, note);
      // Both participants are penalised. Collect failures instead of aborting,
      // so one already-banned account cannot leave the other untouched.
      const failures: string[] = [];
      for (const userId of [s.finderId, s.ownerId]) {
        try {
          await this.penalise.execute(userId, reviewerId, note, s.subjectId);
        } catch (err) {
          failures.push(`${userId}: ${(err as Error).message}`);
        }
      }
      if (failures.length > 0) {
        this.logger.warn('fraud penalty could not be applied to every participant', {
          assessmentId: id,
          failures,
        });
      }
    }

    // Trust is derived, so a finding here must be reflected straight away
    // rather than waiting for these accounts to do something else (§16).
    await this.trust.executeMany([s.finderId, s.ownerId]);

    assessment.review(input.decision, reviewerId, input.note);
    await this.risks.save(assessment);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId: reviewerId,
        action: 'risk.review',
        entity: 'risk_assessment',
        entityId: id,
        meta: {
          decision: input.decision,
          subjectId: s.subjectId,
          score: s.score,
          band: s.band,
          note: input.note,
        },
      }),
    );

    return toRiskAssessmentDTO(assessment);
  }
}
