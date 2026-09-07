import type { MatchDTO, VerificationLevel } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { AuditLog } from '../../../domain/audit/audit-log.entity.js';
import type { Item } from '../../../domain/item/item.entity.js';
import { recoveryActionForCategory } from '../../../domain/points/points-policy.js';
import { RiskAssessment } from '../../../domain/risk/risk-assessment.entity.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { IRecoveryCaseRepository } from '../../ports/custody-repos.js';
import type { IRiskAssessmentRepository } from '../../ports/points-repos.js';
import type { IBusinessRulesRepository } from '../../ports/points-repos.js';
import type {
  IAuditLogRepository,
  ICourierJobRepository,
  IItemRepository,
  IMatchRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { ILogger, IRealtimeBus } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';
import { RecordRecoveryEventUseCase } from '../custody/record-recovery-event.use-case.js';
import { RecomputeTrustScoreUseCase } from '../trust/trust-score.use-cases.js';
import { AwardPointsUseCase } from '../points/award-points.use-case.js';
import { AssessRecoveryRiskUseCase } from '../risk/assess-recovery-risk.use-case.js';
import { toMatchDTO } from './generate-matches.js';

@injectable()
export class ConfirmItemReturnUseCase {
  constructor(
    @inject(TOKENS.MatchRepository) private readonly matches: IMatchRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.CourierJobRepository) private readonly couriers: ICourierJobRepository,
    @inject(TOKENS.AuditLogRepository) private readonly audit: IAuditLogRepository,
    @inject(TOKENS.BusinessRulesRepository) private readonly rulesRepo: IBusinessRulesRepository,
    @inject(TOKENS.RecoveryCaseRepository) private readonly cases: IRecoveryCaseRepository,
    @inject(TOKENS.RiskAssessmentRepository) private readonly risks: IRiskAssessmentRepository,
    @inject(AssessRecoveryRiskUseCase) private readonly assessRisk: AssessRecoveryRiskUseCase,
    @inject(AwardPointsUseCase) private readonly award: AwardPointsUseCase,
    @inject(RecordRecoveryEventUseCase) private readonly recorder: RecordRecoveryEventUseCase,
    @inject(RecomputeTrustScoreUseCase) private readonly trust: RecomputeTrustScoreUseCase,
    @inject(TOKENS.RealtimeBus) private readonly bus: IRealtimeBus,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(matchId: Id, userId: Id): Promise<MatchDTO> {
    const match = await this.matches.findById(matchId);
    if (!match) throw new NotFoundError('Match');
    const lost = await this.items.findById(match.snapshot.lostItemId);
    const found = await this.items.findById(match.snapshot.foundItemId);
    if (!lost || !found) throw new NotFoundError('Item');
    if (match.snapshot.status !== 'accepted' && match.snapshot.status !== 'verified') {
      throw new ConflictError('Match must be accepted before confirming the return');
    }

    if (userId === lost.snapshot.postedById) {
      match.confirmReturnByLost(userId);
    } else if (userId === found.snapshot.postedById) {
      match.confirmReturnByFound(userId);
    } else {
      throw new ForbiddenError('Not a match participant');
    }

    const s = match.snapshot;
    if (s.returnConfirmedByLost && s.returnConfirmedByFound && !s.returnedAt) {
      // One physical item can carry several accepted matches. The item's own
      // status is the guard: a second match settling the same recovery would
      // credit the finder twice for one handover.
      if (found.snapshot.status === 'returned' || lost.snapshot.status === 'returned') {
        throw new ConflictError('This item has already been recorded as returned');
      }
      match.markReturned();
      lost.markReturned();
      found.markReturned();
      await Promise.all([this.items.save(lost), this.items.save(found)]);

      await this.settleRecovery(matchId, lost, found);
    }

    await this.matches.save(match);

    await this.audit.save(
      AuditLog.record({
        id: newId(),
        actorId: userId,
        action: 'match.confirmReturn',
        entity: 'match',
        entityId: match.snapshot.id,
      }),
    );

    return toMatchDTO(match);
  }

  /**
   * Prices and books the BakPoints for a completed recovery.
   *
   * Both parties clicking "returned" is the weakest possible evidence, and spec
   * §7 forbids paying substantial value on it alone. So nothing lands in a
   * balance here: the recovery is scored for collusion first, and the awards are
   * written to the ledger as pending entries weighted by how the item actually
   * changed hands.
   */
  private async settleRecovery(matchId: Id, lost: Item, found: Item): Promise<void> {
    const ownerId = lost.snapshot.postedById;
    const finderId = found.snapshot.postedById;
    const verificationLevel = await this.resolveVerificationLevel(lost, found);

    let assessment: RiskAssessment | null = null;
    try {
      assessment = await this.assessRisk.execute({
        caseRef: matchId,
        ownerId,
        finderId,
        lostItemId: lost.id,
        foundItemId: found.id,
        verificationLevel,
      });
    } catch (err) {
      this.logger.error('risk assessment failed; holding rewards', {
        matchId,
        error: (err as Error).message,
      });
    }

    const rules = await this.rulesRepo.get();
    const extraHoldDays =
      assessment === null || assessment.action !== 'clear'
        ? rules.snapshot.riskExtendedPendingDays
        : 0;

    // A recovery the engine could not score is unscored, not safe. Without a
    // blocking assessment the clearing job would release the points on the
    // extended timetable and nothing would appear in the Trust & Safety queue,
    // so record an explicit manual-review case instead of failing open.
    if (assessment === null) {
      try {
        await this.risks.save(
          RiskAssessment.record({
            id: newId(),
            subjectId: matchId,
            ownerId,
            finderId,
            score: rules.snapshot.riskThresholds.highFrom,
            band: 'high',
            action: 'manual_review',
            ruleHits: [
              {
                code: 'dispute_history',
                weight: 0,
                detail: 'Risk scoring failed for this recovery; queued for manual review',
              },
            ],
          }),
        );
      } catch (err) {
        this.logger.error('could not queue an unscored recovery for review', {
          matchId,
          error: (err as Error).message,
        });
      }
    }

    const category = found.snapshot.category || lost.snapshot.category;
    await this.award.execute({
      userId: finderId,
      action: recoveryActionForCategory(category),
      verificationLevel,
      category,
      caseRef: matchId,
      itemId: found.id,
      counterpartyId: ownerId,
      extraHoldDays,
    });
    // The owner's confirmation is worth far less than the recovery itself, which
    // is what stops a colluding pair from farming both sides of one handover.
    await this.award.execute({
      userId: ownerId,
      action: 'owner_confirmed_recovery',
      verificationLevel,
      caseRef: matchId,
      itemId: lost.id,
      counterpartyId: finderId,
      extraHoldDays,
    });

    // Recovery history is reliability, not spendable value, so it is recorded
    // now rather than waiting on the holding period; a confirmed fraud reverses
    // the points and suspends the account.
    for (const userId of [ownerId, finderId]) {
      const user = await this.users.findById(userId);
      if (!user) continue;
      user.recordSuccessfulReturn();
      await this.users.save(user);
    }
    // Trust is derived, so it is recomputed rather than incremented — this
    // recovery may raise it, leave it flat, or (on a weak peer handover that
    // dilutes their evidence ratio) lower it.
    await this.trust.executeMany([ownerId, finderId]);

    // §9: RETURN_CONFIRMED closes the chain and opens the dispute window. Best
    // effort — the points are already booked, and a case that cannot advance
    // must not roll back a completed recovery.
    try {
      const recoveryCase = await this.cases.findByFoundItemId(found.id);
      if (recoveryCase?.isOpen) {
        if (!recoveryCase.snapshot.matchId) recoveryCase.attachMatch(matchId, lost.id);
        if (recoveryCase.status !== 'released') recoveryCase.verifyOwnership(ownerId);
        recoveryCase.confirmReturn();
        await this.recorder.append(recoveryCase, {
          kind: 'RETURN_CONFIRMED',
          actorId: ownerId,
          evidence: { matchId, confirmedBy: [ownerId, finderId], verificationLevel },
        });
      }
    } catch (err) {
      this.logger.warn('could not close the recovery case', {
        matchId,
        error: (err as Error).message,
      });
    }

    const payload = {
      matchId,
      lostItemId: lost.id,
      foundItemId: found.id,
      verificationLevel,
      // Never leak the score or the rules that produced it (§6).
      rewardsHeld: assessment?.blocksRewards ?? true,
    };
    this.bus.publishToUser(ownerId, 'item:returned', payload);
    this.bus.publishToUser(finderId, 'item:returned', payload);
  }

  /**
   * Classifies how the item actually changed hands (§5).
   *
   * A real custody record is checked first and wins: the level it recorded was
   * decided by the partner's tier at intake, when an independent party actually
   * had the item. Falling through to `institutionId` alone would grade every
   * Recovery Point deposit as level D, quietly overpaying it and leaving level B
   * unreachable — and `institutionId` is only a claim about an item, not
   * evidence that anyone took custody of it.
   */
  private async resolveVerificationLevel(lost: Item, found: Item): Promise<VerificationLevel> {
    const custodyCase = await this.cases.findByFoundItemId(found.id);
    if (custodyCase?.snapshot.custodyRecordId) {
      return custodyCase.snapshot.verificationLevel;
    }
    const delivered =
      (await this.couriers.findDeliveredForItem(found.id)) ??
      (await this.couriers.findDeliveredForItem(lost.id));
    if (delivered) return 'verified_delivery';
    // An institution-tagged item with no custody record is an unwitnessed
    // handover that merely happened at a partner venue.
    return 'peer';
  }
}
