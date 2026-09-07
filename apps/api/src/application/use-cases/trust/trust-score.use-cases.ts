import type { PublicTrustDTO, TrustScoreDTO } from '@back2u/shared-types';
import { inject, injectable } from 'inversify';

import { computeTrustScore, type TrustSignals } from '../../../domain/trust/trust-score.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import type { Id } from '../../../domain/shared/id.js';
import type {
  ICustodyRecordRepository,
  IPartnerStaffRepository,
} from '../../ports/custody-repos.js';
import type {
  IPointLedgerRepository,
  IRiskAssessmentRepository,
} from '../../ports/points-repos.js';
import type { IReviewRepository, IUserRepository } from '../../ports/repositories.js';
import type { ILogger } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const MS_PER_DAY = 86_400_000;
/** Confirmed-fraud findings older than this stop weighing on the score. */
const FRAUD_LOOKBACK_DAYS = 365;

/**
 * Recomputes an account's Trust Score from current facts (spec §16).
 *
 * Deliberately a recompute rather than an increment. BakPoints measure
 * contribution and go up as you do more; trust measures reliability, and the
 * spec is explicit that it "must be separate so that a user cannot simply buy
 * trust through activity volume". Because it is derived, it also falls on its
 * own when a reversal or a confirmed fraud lands.
 */
@injectable()
export class RecomputeTrustScoreUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private readonly users: IUserRepository,
    @inject(TOKENS.PointLedgerRepository) private readonly ledger: IPointLedgerRepository,
    @inject(TOKENS.RiskAssessmentRepository) private readonly risks: IRiskAssessmentRepository,
    @inject(TOKENS.ReviewRepository) private readonly reviews: IReviewRepository,
    @inject(TOKENS.PartnerStaffRepository) private readonly staff: IPartnerStaffRepository,
    @inject(TOKENS.CustodyRecordRepository) private readonly custody: ICustodyRecordRepository,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async execute(userId: Id): Promise<TrustScoreDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    const s = user.snapshot;
    const now = new Date();

    const [ledgerSignals, fraudCount, rating, memberships] = await Promise.all([
      this.ledger.trustSignalsFor(userId),
      this.risks.countForUser(userId, new Date(now.getTime() - FRAUD_LOOKBACK_DAYS * MS_PER_DAY)),
      this.reviews.countAndAverageForUser(userId),
      this.staff.listForUser(userId),
    ]);

    // Partner integrity only applies to someone who actually handles custody.
    let partner: TrustSignals['partner'];
    const membership = memberships[0];
    if (membership) {
      const counts = await this.custody.countForInstitution(membership.institutionId);
      partner = {
        depositsToReturnsRatio: counts.deposits > 0 ? counts.releases / counts.deposits : null,
        custodyDisputes: 0,
      };
    }

    const signals: TrustSignals = {
      emailVerified: s.emailVerified,
      phoneVerified: s.phoneVerified,
      mfaEnabled: s.mfaEnabled,
      status: s.status,
      accountAgeDays: (now.getTime() - s.createdAt.getTime()) / MS_PER_DAY,
      // The ledger is the record of what the platform actually verified;
      // `successfulReturns` is a counter anyone's flow could bump.
      verifiedRecoveries: ledgerSignals.recoveries,
      strongEvidenceRecoveries: ledgerSignals.strongEvidenceRecoveries,
      distinctCounterparties: ledgerSignals.distinctCounterparties,
      reviewCount: rating.count,
      averageRating: rating.count > 0 ? rating.average : undefined,
      confirmedFraudCount: fraudCount,
      reversalCount: ledgerSignals.reversals,
      partner,
    };

    const result = computeTrustScore(signals);
    user.setTrust(result.score, result.level);
    await this.users.save(user);

    this.logger.info('trust score recomputed', {
      userId,
      score: result.score,
      level: result.level,
    });

    return {
      userId,
      score: result.score,
      level: result.level,
      nextLevel: result.nextLevel,
      nextLevelRequirement: result.nextLevelRequirement,
      components: result.components,
      computedAt: now.toISOString(),
    };
  }

  /** Recomputes several accounts, never letting one failure stop the rest. */
  async executeMany(userIds: Id[]): Promise<void> {
    for (const userId of userIds) {
      try {
        await this.execute(userId);
      } catch (err) {
        this.logger.warn('trust recompute failed', { userId, error: (err as Error).message });
      }
    }
  }
}

/** The owner's own view — the full breakdown, so they can see how to improve. */
@injectable()
export class GetMyTrustScoreUseCase {
  constructor(
    @inject(RecomputeTrustScoreUseCase) private readonly recompute: RecomputeTrustScoreUseCase,
  ) {}

  execute(userId: Id): Promise<TrustScoreDTO> {
    return this.recompute.execute(userId);
  }
}

/**
 * What anyone else sees: the level and headline score, never the components.
 * The breakdown names the signals behind the number, and publishing those would
 * tell a bad actor exactly which lever to pull.
 */
@injectable()
export class GetPublicTrustUseCase {
  constructor(@inject(TOKENS.UserRepository) private readonly users: IUserRepository) {}

  async execute(userId: Id): Promise<PublicTrustDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    const s = user.snapshot;
    return { userId, level: s.trustLevel, score: s.trustScore };
  }
}
