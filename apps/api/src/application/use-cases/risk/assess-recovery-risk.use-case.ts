import type { VerificationLevel } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import {
  RiskAssessment,
  toRiskAssessmentDTO,
} from '../../../domain/risk/risk-assessment.entity.js';
import {
  evaluateRecoveryRisk,
  riskHelpers,
  type RecoveryRiskSignals,
} from '../../../domain/risk/risk-rules.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import { newId, type Id } from '../../../domain/shared/id.js';
import type { ICustodyRecordRepository } from '../../ports/custody-repos.js';
import type {
  IBusinessRulesRepository,
  IPointLedgerRepository,
  IRiskAssessmentRepository,
} from '../../ports/points-repos.js';
import type {
  IItemRepository,
  IRewardRepository,
  IUserRepository,
} from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const MS_PER_DAY = 86_400_000;

/** Below this many deposits, concentration is noise rather than a pattern. */
const MIN_DEPOSITS_FOR_CONCENTRATION = 4;

export interface AssessRecoveryRiskCommand {
  /** The recovery being scored — a match id today. */
  caseRef: Id;
  ownerId: Id;
  finderId: Id;
  lostItemId: Id;
  foundItemId: Id;
  verificationLevel: VerificationLevel;
}

/**
 * Scores one recovery and persists the private assessment (§6).
 *
 * Every signal is gathered here so the rule engine itself stays pure. Signals
 * the platform cannot yet observe — partner custody concentration lands with the
 * Recovery Point network — are reported as their neutral value rather than
 * guessed at, so a rule only ever fires on evidence that actually exists.
 */
@injectable()
export class AssessRecoveryRiskUseCase {
  constructor(
    @inject(TOKENS.RiskAssessmentRepository) private readonly risks: IRiskAssessmentRepository,
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.BusinessRulesRepository) private readonly rulesRepo: IBusinessRulesRepository,
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.ItemRepository) private readonly items: IItemRepository,
    @inject(TOKENS.RewardRepository) private readonly rewards: IRewardRepository,
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(cmd: AssessRecoveryRiskCommand): Promise<RiskAssessment> {
    const existing = await this.risks.findBySubject(cmd.caseRef);
    if (existing) return existing;

    const [rules, owner, finder, lost, found] = await Promise.all([
      this.rulesRepo.get(),
      this.users.findById(cmd.ownerId),
      this.users.findById(cmd.finderId),
      this.items.findById(cmd.lostItemId),
      this.items.findById(cmd.foundItemId),
    ]);
    if (!owner || !finder) throw new NotFoundError('User');
    if (!lost || !found) throw new NotFoundError('Item');

    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

    const [
      priorPairCount,
      reciprocalCount,
      highValueRecoveriesLast30d,
      ownerFraudCount,
      finderFraudCount,
      depositsByInstitution,
    ] = await Promise.all([
      this.ledger.countPairRecoveries(cmd.finderId, cmd.ownerId),
      // The owner having previously been *this* finder's finder is the
      // reciprocal pattern the spec calls out explicitly.
      this.ledger.countPairRecoveriesAsFinder(cmd.ownerId, cmd.finderId),
      // Device recoveries are the platform's high-value class (§3), and stand
      // in for value-weighted frequency until item valuations are captured.
      this.ledger.countByActionSince(cmd.finderId, ['recovery_device'], monthAgo),
      this.risks.countForUser(cmd.ownerId, monthAgo),
      this.risks.countForUser(cmd.finderId, monthAgo),
      this.custody.countDepositsByInstitutionForUser(cmd.finderId, monthAgo),
    ]);

    // §6: reward farming concentrated through one partner. Meaningless below a
    // handful of deposits — one deposit is trivially 100% concentrated — so the
    // signal only reports once there is enough history to be a pattern.
    const depositCounts = Object.values(depositsByInstitution);
    const totalDeposits = depositCounts.reduce((sum, n) => sum + n, 0);
    const partnerConcentration =
      totalDeposits >= MIN_DEPOSITS_FOR_CONCENTRATION
        ? Math.max(...depositCounts) / totalDeposits
        : 0;

    const ownerState = owner.snapshot;
    const finderState = finder.snapshot;

    // A shared push token means the two accounts are installed on one device.
    const sharedDevice = ownerState.pushTokens.some((t) => finderState.pushTokens.includes(t));

    const ownerPayout = ownerState.momoNumber ?? ownerState.phone;
    const finderPayout = finderState.momoNumber ?? finderState.phone;
    const sharedPayoutAccount =
      ownerPayout !== undefined && ownerPayout.length > 0 && ownerPayout === finderPayout;

    const reward = found.snapshot.rewardId
      ? await this.rewards.findById(found.snapshot.rewardId)
      : lost.snapshot.rewardId
        ? await this.rewards.findById(lost.snapshot.rewardId)
        : null;

    const signals: RecoveryRiskSignals = {
      ownerId: cmd.ownerId,
      finderId: cmd.finderId,
      priorPairCount,
      reciprocalCount,
      sharedDevice,
      sharedPayoutAccount,
      youngestAccountAgeDays: Math.min(
        riskHelpers.daysSince(ownerState.createdAt, now),
        riskHelpers.daysSince(finderState.createdAt, now),
      ),
      hoursBetweenReports: riskHelpers.hoursBetween(
        lost.snapshot.createdAt,
        found.snapshot.createdAt,
      ),
      highValueRecoveriesLast30d,
      duplicateMedia: found.snapshot.duplicateOfId !== undefined,
      partnerConcentration,
      disputeCount: ownerFraudCount + finderFraudCount,
      itemValueMinor: reward?.snapshot.amount,
      peerOnlyReturn: cmd.verificationLevel === 'peer',
    };

    const evaluation = evaluateRecoveryRisk(signals, rules);
    const assessment = RiskAssessment.record({
      id: newId(),
      subjectId: cmd.caseRef,
      ownerId: cmd.ownerId,
      finderId: cmd.finderId,
      score: evaluation.score,
      band: evaluation.band,
      action: evaluation.action,
      ruleHits: evaluation.ruleHits,
    });
    await this.risks.save(assessment);

    this.logger.info('recovery risk assessed', { ...toRiskAssessmentDTO(assessment) });
    return assessment;
  }
}
